#!/usr/bin/env python3
from __future__ import annotations
import json, os, sys
from Crypto.Hash import keccak as ck

def keccak256(data: bytes) -> bytes:
    k = ck.new(digest_bits=256)
    k.update(data)
    return k.digest()

PORTAL = bytes.fromhex("5bEacaF7ABCbB3aB280e80D007FD31fcE26510e9")
IMPL = bytes.fromhex("E6Ff967a887084c16D0fD71548CF709542cc1557")
SUFFIX = "7777"

def minimal_proxy_initcode(impl: bytes) -> bytes:
    return bytes.fromhex("3d602d80600a3d3981f3363d3d373d3d3d363d73" + impl.hex() + "5af43d82803e903d91602b57fd5bf3")

def create2_address(deployer: bytes, salt: bytes, initcode: bytes) -> bytes:
    return keccak256(b"\xff" + deployer + salt + keccak256(initcode))[-20:]

def find_salt():
    initcode = minimal_proxy_initcode(IMPL)
    salt = keccak256(os.urandom(32))
    n = 0
    while True:
        addr = create2_address(PORTAL, salt, initcode)
        if addr.hex().endswith(SUFFIX):
            return salt, "0x" + addr.hex(), n
        salt = keccak256(salt)
        n += 1

if __name__ == "__main__":
    salt, addr, n = find_salt()
    print(json.dumps({"salt": "0x" + salt.hex(), "token": addr, "iterations": n}))
