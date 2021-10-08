import json
import base64
from algosdk import account, mnemonic
from algosdk.v2client import algod
import time

# This is a complete code example that:
#   1. Create a new test account
#   2. Ask to fund your created account

def create_account():
  # Using Rand Labs Developer API
  # see https://github.com/algorand/py-algorand-sdk/issues/169
  # Change algod_token and algod_address to connect to a different client
  algod_token = "2f3203f21e738a1de6110eba6984f9d03e5a95d7a577b34616854064cf2c0e7b"
  algod_address = "https://academy-algod.dev.aws.algodev.network/"
  algod_client = algod.AlgodClient(algod_token, algod_address)

  #Generate new account for this transaction
  secret_key, my_address = account.generate_account()
  m = mnemonic.from_private_key(secret_key)
  print("My address: {}".format(my_address))

  # Check your balance. It should be 0 microAlgos
  account_info = algod_client.account_info(my_address)
  print("Account balance: {} microAlgos".format(account_info.get('amount')) + "\n")

  #Fund the created account
  print('Go to the below link to fund the created account using testnet faucet: \n https://dispenser.testnet.aws.algodev.network/?account={}'.format(my_address))

  completed = ""
  while completed.lower() != 'yes':
    completed = input("Type 'yes' once you funded the account: ");

  print('Fund transfer in process...')
  # Wait for the faucet to transfer funds
  time.sleep(10)
  
  print('Fund transferred!')
  # Check your balance. It should be 10000000 microAlgos
  account_info = algod_client.account_info(my_address)
  print("Account balance: {} microAlgos".format(account_info.get('amount')) + "\n")

  return m

# utility for waiting on a transaction confirmation
def wait_for_confirmation(client, transaction_id, timeout):
    """
    Wait until the transaction is confirmed or rejected, or until 'timeout'
    number of rounds have passed.
    Args:
        transaction_id (str): the transaction to wait for
        timeout (int): maximum number of rounds to wait    
    Returns:
        dict: pending transaction information, or throws an error if the transaction
            is not confirmed or rejected in the next timeout rounds
    """
    start_round = client.status()["last-round"] + 1;
    current_round = start_round

    while current_round < start_round + timeout:
        try:
            pending_txn = client.pending_transaction_info(transaction_id)
        except Exception:
            return 
        if pending_txn.get("confirmed-round", 0) > 0:
            return pending_txn
        elif pending_txn["pool-error"]:  
            raise Exception(
                'pool error: {}'.format(pending_txn["pool-error"]))
        client.status_after_block(current_round)                   
        current_round += 1
    raise Exception(
        'pending tx not found in timeout rounds, timeout value = : {}'.format(timeout))