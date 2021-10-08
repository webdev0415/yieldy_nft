from algosdk.future.transaction import PaymentTxn

def closeout_account(my_address, secret_key, algod_client):
# build transaction
  print("Building transaction")
  params = algod_client.suggested_params()
  # comment out the next two (2) lines to use suggested fees
  params.flat_fee = True
  params.fee = 1000
  receiver = "HZ57J3K46JIJXILONBBZOHX6BKPXEM2VVXNRFSUED6DKFD5ZD24PMJ3MVA"
  note = "closing out account".encode()

  # Fifth argument is a close_remainder_to parameter that creates a payment txn that sends all of the remaining funds to the specified address. If you want to learn more, go to: https://developer.algorand.org/docs/reference/transactions/#payment-transaction
  unsigned_txn = PaymentTxn(my_address, params, receiver, 0, receiver, note)

  # sign transaction
  print("Signing transaction")
  signed_txn = unsigned_txn.sign(secret_key)
  print("Sending transaction")
  txid = algod_client.send_transaction(signed_txn)
  print('Transaction Info:')
  print("Signed transaction with txID: {}".format(txid))

  # wait for confirmation	
  try:
    print("Waiting for confirmation")
    wait_for_confirmation(algod_client, txid, 4)  
  except Exception as err:
    print(err)
    return
  
  account_info = algod_client.account_info(my_address)
  print("Account balance: {} microAlgos".format(account_info.get('amount')) + "\n")
  
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