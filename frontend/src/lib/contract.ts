import {
  Contract,
  rpc,
  TransactionBuilder,
  Account,
  scValToNative,
  nativeToScVal,
  Address,
  BASE_FEE,
} from "@stellar/stellar-sdk";
import { CONTRACT_ID, NETWORK_PASSPHRASE, RPC_URL } from "./config";
import { signXdr, normalizeWalletError, ContractCallError } from "./wallet";

export type TxStatus = "idle" | "building" | "pending" | "success" | "error";

export interface TxResult {
  status: TxStatus;
  hash?: string;
  error?: string;
}

export interface AuctionState {
  itemName: string;
  startingPrice: number;
  highestBid: number;
  highestBidder: string | null;
  endLedger: number;
  currentLedger: number;
  ended: boolean;
}

const server = new rpc.Server(RPC_URL);

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

async function readContract(method: string, args: unknown[], sourcePubKey: string) {
  const contract = new Contract(CONTRACT_ID);
  const account = await getAccountForRead(sourcePubKey);

  const scArgs = args.map((a) => toScVal(a));
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...scArgs))
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);

  if (rpc.Api.isSimulationError(sim)) {
    throw new ContractCallError(sim.error);
  }
  if (!sim.result?.retval) {
    return undefined;
  }
  return scValToNative(sim.result.retval);
}

async function getAccountForRead(sourcePubKey: string): Promise<Account> {
  try {
    return await server.getAccount(sourcePubKey);
  } catch {
    return new Account(sourcePubKey, "0");
  }
}

function toScVal(value: unknown) {
  if (value instanceof Address) {
    return value.toScVal();
  }
  if (typeof value === "string" && value.startsWith("G") && value.length === 56) {
    return new Address(value).toScVal();
  }
  return nativeToScVal(value);
}

/** i128 fields decode as BigInt — narrow to Number for display purposes. */
function toNumber(v: unknown): number {
  if (typeof v === "bigint") return Number(v);
  return Number(v ?? 0);
}

export async function getAuctionState(readerAddress: string): Promise<AuctionState> {
  const raw = await readContract("get_state", [], readerAddress);
  return {
    itemName: raw.item_name,
    startingPrice: toNumber(raw.starting_price),
    highestBid: toNumber(raw.highest_bid),
    highestBidder: raw.highest_bidder ?? null,
    endLedger: Number(raw.end_ledger),
    currentLedger: Number(raw.current_ledger),
    ended: Boolean(raw.ended),
  };
}

// ---------------------------------------------------------------------------
// Writes: place a bid / end the auction, with full status tracking
// ---------------------------------------------------------------------------

async function submitInvocation(
  sourceAddress: string,
  op: ReturnType<Contract["call"]>,
  onStatus: (r: TxResult) => void
): Promise<void> {
  try {
    onStatus({ status: "building" });

    const account = await server.getAccount(sourceAddress);

    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(op)
      .setTimeout(60)
      .build();

    const prepared = await server.prepareTransaction(tx);
    const signedXdr = await signXdr(prepared.toXDR(), sourceAddress);

    onStatus({ status: "pending" });

    const signedTx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
    const sendResult = await server.sendTransaction(signedTx);

    if (sendResult.status === "ERROR") {
      throw new ContractCallError(
        `Transaction failed to submit: ${JSON.stringify(sendResult.errorResult)}`
      );
    }

    const hash = sendResult.hash;
    const finalStatus = await pollTransactionStatus(hash);

    if (finalStatus === "SUCCESS") {
      onStatus({ status: "success", hash });
    } else {
      onStatus({ status: "error", hash, error: `Transaction ${finalStatus.toLowerCase()} on-chain.` });
    }
  } catch (err) {
    const normalized = normalizeWalletError(err);
    onStatus({ status: "error", error: normalized.message });
  }
}

export async function placeBid(
  bidderAddress: string,
  amount: number,
  onStatus: (r: TxResult) => void
): Promise<void> {
  const contract = new Contract(CONTRACT_ID);
  const op = contract.call(
    "place_bid",
    new Address(bidderAddress).toScVal(),
    nativeToScVal(BigInt(Math.trunc(amount)), { type: "i128" })
  );
  await submitInvocation(bidderAddress, op, onStatus);
}

export async function endAuction(
  callerAddress: string,
  onStatus: (r: TxResult) => void
): Promise<void> {
  const contract = new Contract(CONTRACT_ID);
  const op = contract.call("end_auction");
  await submitInvocation(callerAddress, op, onStatus);
}

async function pollTransactionStatus(hash: string, attempts = 15, delayMs = 2000): Promise<string> {
  for (let i = 0; i < attempts; i++) {
    await new Promise((res) => setTimeout(res, delayMs));
    const result = await server.getTransaction(hash);
    if (result.status !== "NOT_FOUND") {
      return result.status;
    }
  }
  return "TIMEOUT";
}
