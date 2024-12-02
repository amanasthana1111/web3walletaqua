import React, { useEffect, useState } from 'react';
import { sendToken } from '../../utils/TransactionUtils';
import { sepolia } from '../../models/Chain'; // Use Sepolia configuration
import { Account } from '../../models/Account';
import AccountTransactions from './AccountTransactions';
import { ethers } from 'ethers';
import { toFixedIfNecessary } from '../../utils/AccountUtils';
import './Account.css';

interface AccountDetailProps {
  account: Account;
}

const AccountDetail: React.FC<AccountDetailProps> = ({ account }) => {
  const [destinationAddress, setDestinationAddress] = useState('');
  const [amount, setAmount] = useState(0);
  const [balance, setBalance] = useState(account.balance);

  const [networkResponse, setNetworkResponse] = useState<{
    status: null | 'pending' | 'complete' | 'error';
    message: string | React.ReactElement;
  }>({
    status: null,
    message: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      const provider = new ethers.providers.JsonRpcProvider(sepolia.rpcUrl); // Use Sepolia RPC URL
      let accountBalance = await provider.getBalance(account.address);
      setBalance(String(toFixedIfNecessary(ethers.utils.formatEther(accountBalance))));
    };
    fetchData();
  }, [account.address]);

  function handleDestinationAddressChange(event: React.ChangeEvent<HTMLInputElement>) {
    setDestinationAddress(event.target.value);
  }

  function handleAmountChange(event: React.ChangeEvent<HTMLInputElement>) {
    setAmount(Number.parseFloat(event.target.value));
  }

  async function transfer() {
    setNetworkResponse({
      status: 'pending',
      message: '',
    });

    try {
      const { receipt } = await sendToken(amount, account.address, destinationAddress, account.privateKey);

      if (receipt.status === 1) {
        setNetworkResponse({
          status: 'complete',
          message: (
            <p>
              Transfer complete!{' '}
              <a
                href={`${sepolia.blockExplorerUrl}/tx/${receipt.transactionHash}`} // Use Sepolia block explorer
                target="_blank"
                rel="noreferrer"
              >
                View transaction
              </a>
            </p>
          ),
        });
        return receipt;
      } else {
        console.log(`Failed to send ${receipt}`);
        setNetworkResponse({
          status: 'error',
          message: JSON.stringify(receipt),
        });
        return { receipt };
      }
    } catch (error: any) {
      console.error({ error });
      setNetworkResponse({
        status: 'error',
        message: error.reason || JSON.stringify(error),
      });
    }
  }

  return (
    <div className="AccountDetail container">
      <h4>
        Address:{' '}
        <a
          href={`${sepolia.blockExplorerUrl}/address/${account.address}`} // Use Sepolia block explorer
          target="_blank"
          rel="noreferrer"
        >
          {account.address}
        </a>
        <br />
        Balance: {balance} ETH
      </h4>

      <div className="form-group">
        <label>Destination Address:</label>
        <input
          className="form-control"
          type="text"
          value={destinationAddress}
          onChange={handleDestinationAddressChange}
        />
      </div>

      <div className="form-group">
        <label>Amount:</label>
        <input
          className="form-control"
          type="number"
          value={amount}
          onChange={handleAmountChange}
        />
      </div>

      <button
        className="btn btn-primary"
        type="button"
        onClick={transfer}
        disabled={!amount || networkResponse.status === 'pending'}
      >
        Send {amount} ETH
      </button>

      {networkResponse.status && (
        <>
          {networkResponse.status === 'pending' && <p>Transfer is pending...</p>}
          {networkResponse.status === 'complete' && <p>{networkResponse.message}</p>}
          {networkResponse.status === 'error' && (
            <p>Error occurred while transferring tokens: {networkResponse.message}</p>
          )}
        </>
      )}

      <AccountTransactions account={account} />
    </div>
  );
};

export default AccountDetail;
