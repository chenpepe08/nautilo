#!/usr/bin/env bash
# On-chain E2E for PddBargainVault on BSC testnet (cast-only).
# Env: DEPLOYER_PRIVATE_KEY, VAULT_ADDRESS, TOKEN_ADDRESS, INVITE_CODE
set -euo pipefail
export PATH="${HOME}/.foundry/bin:${PATH}"

RPC="${BSC_TESTNET_RPC_URL:-https://bsc-testnet-rpc.publicnode.com}"
VAULT="${VAULT_ADDRESS:?}"
TOKEN="${TOKEN_ADDRESS:?}"
CODE="${INVITE_CODE:?}"
PK="${DEPLOYER_PRIVATE_KEY:?}"
case "${PK}" in 0x*|0X*) ;; *) PK="0x${PK}" ;; esac

INVITER=$(cast wallet address --private-key "${PK}")

echo "=== E2E start chain=$(cast chain-id --rpc-url "${RPC}") ==="
echo "vault=${VAULT} token=${TOKEN} code=${CODE} inviter=${INVITER}"

# Fresh random helpers (avoid Hardhat default addrs which have code on BSC testnet)
TMPDIR_E2E=$(mktemp -d)
trap 'rm -rf "${TMPDIR_E2E}"' EXIT
declare -a HELPERS
for i in 1 2 3 4 5; do
  # JSON mode; never echo private keys
  wjson=$(cast wallet new --json)
  haddr=$(python3 -c "import json,sys; print(json.load(sys.stdin)['data'][0]['address'])" <<<"${wjson}")
  hpk=$(python3 -c "import json,sys; print(json.load(sys.stdin)['data'][0]['private_key'])" <<<"${wjson}")
  printf '%s' "${hpk}" > "${TMPDIR_E2E}/h${i}.pk"
  HELPERS+=("${haddr}")
done
echo "helpers=${HELPERS[*]}"

vsize=$(cast codesize "${VAULT}" --rpc-url "${RPC}")
tsize=$(cast codesize "${TOKEN}" --rpc-url "${RPC}")
echo "codesize vault=${vsize} token=${tsize}"
[[ "${vsize}" -gt 0 && "${tsize}" -gt 0 ]]

VBAL=$(cast balance "${VAULT}" --rpc-url "${RPC}")
if [[ "${VBAL}" -lt 10000000000000000 ]]; then
  echo "=== fund vault 0.05 tBNB ==="
  cast send "${VAULT}" --value 0.05ether --private-key "${PK}" --rpc-url "${RPC}" --legacy --gas-price 1gwei >/dev/null
  VBAL=$(cast balance "${VAULT}" --rpc-url "${RPC}")
fi
echo "vaultBalanceWei=${VBAL}"

echo "=== fund helpers ==="
for i in 1 2 3 4 5; do
  haddr="${HELPERS[$((i-1))]}"
  cast send "${haddr}" --value 0.002ether --private-key "${PK}" --rpc-url "${RPC}" --legacy --gas-price 1gwei >/dev/null
  echo "helper ${haddr} bal=$(cast balance "${haddr}" --rpc-url "${RPC}")"
done

echo "inviterTokenBal=$(cast call "${TOKEN}" "balanceOf(address)(uint256)" "${INVITER}" --rpc-url "${RPC}")"

echo "=== createInvite ==="
cast send "${VAULT}" "createInvite(string)" "${CODE}" --private-key "${PK}" --rpc-url "${RPC}" --legacy --gas-price 1gwei >/dev/null
HASH=$(cast call "${VAULT}" "codeHashOf(string)(bytes32)" "${CODE}" --rpc-url "${RPC}")
echo "codeHash=${HASH}"

CAMP_INVITER=$(cast call "${VAULT}" "campaignOf(bytes32)(address,uint32,bool,uint256)" "${HASH}" --rpc-url "${RPC}" | sed -n '1p')
echo "campaign.inviter=${CAMP_INVITER}"
[[ "$(echo "${INVITER}" | tr 'A-Z' 'a-z')" == "$(echo "${CAMP_INVITER}" | tr 'A-Z' 'a-z')" ]]

echo "=== help x5 ==="
for i in 1 2 3 4 5; do
  hpk=$(cat "${TMPDIR_E2E}/h${i}.pk")
  cast send "${VAULT}" "help(string)" "${CODE}" --private-key "${hpk}" --rpc-url "${RPC}" --legacy --gas-price 1gwei >/dev/null
  echo "helped_by=${HELPERS[$((i-1))]}"
done

HELPS_NUM=$(cast call "${VAULT}" "campaignOf(bytes32)(address,uint32,bool,uint256)" "${HASH}" --rpc-url "${RPC}" | sed -n '2p' | awk '{print $1}')
echo "helpCount=${HELPS_NUM}"
[[ "${HELPS_NUM}" == "5" ]]

CLAIMABLE=$(cast call "${VAULT}" "claimableAmount(string)(uint256)" "${CODE}" --rpc-url "${RPC}" | awk '{print $1}')
VBAL_BEFORE=$(cast balance "${VAULT}" --rpc-url "${RPC}")
BPS=$(cast call "${VAULT}" "claimBps()(uint16)" --rpc-url "${RPC}" | awk '{print $1}')
EXPECTED=$(python3 -c "print(int('${VBAL_BEFORE}') * int('${BPS}') // 10000)")
echo "claimable=${CLAIMABLE} expected=${EXPECTED} vaultBefore=${VBAL_BEFORE}"
[[ "${CLAIMABLE}" == "${EXPECTED}" ]]

echo "=== claim ==="
TXJSON=$(cast send "${VAULT}" "claim(string)" "${CODE}" --private-key "${PK}" --rpc-url "${RPC}" --legacy --gas-price 1gwei --json)
TXHASH=$(python3 -c "import json,sys; d=json.loads(sys.argv[1]); print(d.get('transactionHash') or d.get('hash') or '')" "${TXJSON}")
echo "claimTx=${TXHASH}"

VBAL_AFTER=$(cast balance "${VAULT}" --rpc-url "${RPC}")
CLAIMED_FLAG=$(cast call "${VAULT}" "campaignOf(bytes32)(address,uint32,bool,uint256)" "${HASH}" --rpc-url "${RPC}" | sed -n '3p' | awk '{print $1}')
CLAIMED_AMT=$(cast call "${VAULT}" "campaignOf(bytes32)(address,uint32,bool,uint256)" "${HASH}" --rpc-url "${RPC}" | sed -n '4p' | awk '{print $1}')
echo "claimed=${CLAIMED_FLAG} claimedAmount=${CLAIMED_AMT} vaultAfter=${VBAL_AFTER}"

python3 - <<PY
claimed_flag = "${CLAIMED_FLAG}".lower()
assert claimed_flag in ("true", "1"), claimed_flag
claimed_amt = int("${CLAIMED_AMT}")
expected = int("${EXPECTED}")
v_before = int("${VBAL_BEFORE}")
v_after = int("${VBAL_AFTER}")
assert claimed_amt == expected, (claimed_amt, expected)
assert v_after == v_before - expected, (v_after, v_before, expected)
print("PASS E2E: claimed", claimed_amt, "vault", v_before, "->", v_after)
PY

LOGS=0
if [[ -n "${TXHASH}" ]]; then
  LOGS=$(cast receipt "${TXHASH}" --rpc-url "${RPC}" --json | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('logs',[])))")
  echo "claimReceiptLogs=${LOGS}"
fi

OUT_DIR="$(cd "$(dirname "$0")/.." && pwd)/deployments"
mkdir -p "${OUT_DIR}"
python3 - <<PY
import json
doc = {
  "network": "bsc-testnet",
  "chainId": 97,
  "vault": "${VAULT}",
  "token": "${TOKEN}",
  "inviteCode": "${CODE}",
  "codeHash": "${HASH}",
  "helps": 5,
  "claimBps": int("${BPS}"),
  "vaultBeforeWei": "${VBAL_BEFORE}",
  "claimedWei": "${CLAIMED_AMT}",
  "vaultAfterWei": "${VBAL_AFTER}",
  "claimTx": "${TXHASH}",
  "claimReceiptLogs": int("${LOGS}"),
  "helpers": """${HELPERS[0]} ${HELPERS[1]} ${HELPERS[2]} ${HELPERS[3]} ${HELPERS[4]}""".split(),
  "result": "PASS",
}
path = "${OUT_DIR}/e2e-bsc-testnet-latest.json"
open(path, "w").write(json.dumps(doc, indent=2) + "\n")
print("wrote", path)
PY

echo "=== E2E PASS ==="
