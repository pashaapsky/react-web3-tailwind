import React, {useEffect, useState} from 'react';
import {ethers} from 'ethers';

import {contractABI, contractAddress} from '../utils/constants';

export const TransactionContext = React.createContext();

const {ethereum} = window;

const getEthereumContract = () => {
    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();
    const transactionContract = new ethers.Contract(contractAddress, contractABI, signer);

    //return contract with out methods
    return transactionContract;
}

export const TransactionProvider = ({children}) => {
    const [connectedAccount, setConnectedAccount] = useState(null);
    const [transactionCount, setTransactionCount] = useState(localStorage.getItem('transactionCount'));
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        addressTo: '',
        amount: '',
        keyword: '',
        message: '',
    });

    const handleChange = (e, name) => {
        setFormData((prevState) => ({...prevState, [name]: e.target.value}))
    }

    const getAllTransactions = async () => {
        try {
            if (!ethereum) return alert("Please install metamask");

            const transactionContract = getEthereumContract();

            const availableTransactions = await transactionContract.getAllTransactions();

            const structuredTransactions = availableTransactions.map((transaction) => ({
                addressTo: transaction.receiver,
                addressFrom: transaction.sender,
                timestamp: new Date(transaction.timestamp.toNumber() * 1000).toLocaleString(),
                message: transaction.message,
                keyword: transaction.keyword,
                amount: parseInt(transaction.amount._hex) / (10 ** 18),
            }))

            setTransactions(structuredTransactions);
        } catch (error) {
            console.error(error);

            throw new Error("No ethereum object.");
        }
    }

    const checkIfWalletIsConnected = async () => {
        try {
            if (!ethereum) return alert("Please install metamask");

            // подключенные аккаунты
            const accounts = await ethereum.request({method: 'eth_accounts'});

            if (accounts.length) {
                setConnectedAccount(accounts[0]);

                await getAllTransactions();
            } else {
                console.log('No accounts found');
            }
        } catch (error) {
            console.error(error);

            throw new Error("No ethereum object.");
        }
    }

    const checkIfTransactionsExist = async () => {
        try {
            if (!ethereum) return alert("Please install metamask");

            const transactionContract = getEthereumContract();
            const transactionCount = await transactionContract.getTransactionCount();

            window.localStorage.setItem("transactionCount", transactionCount);
        } catch (error) {
            console.error(error);

            throw new Error("No ethereum object.");
        }
    }

    const connectWallet = async () => {
        try {
            if (!ethereum) return alert("Please install metamask");

            // какие аккаунты вообще есть в metaMask
            const availableAccounts = await ethereum.request({method: 'eth_requestAccounts'});

            setConnectedAccount(availableAccounts[0]);
        } catch (error) {
            console.error(error);

            throw new Error("No ethereum object.");
        }
    }

    const sendTransaction = async () => {
        try {
            if (!ethereum) return alert("Please install metamask");

            const {addressTo, amount, keyword, message} = formData;
            const transactionContract = getEthereumContract();
            const parsedAmount = ethers.utils.parseEther(amount);

            await ethereum.request({
                method: 'eth_sendTransaction', params: [
                    {
                        from: connectedAccount,
                        to: addressTo,
                        gas: '0x5208', //21000 GWEI
                        value: parsedAmount._hex, //0.00001
                    }
                ]
            });

            const transactionHash = await transactionContract.addToBlockchain(addressTo, parsedAmount, message, keyword);

            setLoading(true);
            console.log(`loading: - ${transactionHash.hash}`);
            await transactionHash.wait();
            setLoading(false);
            await getAllTransactions();
            console.log(`success: - ${transactionHash.hash}`);

            const transactionCount = await transactionContract.getTransactionCount();
            setTransactionCount(transactionCount.toNumber());

        } catch (error) {
            console.error(error);

            throw new Error("No ethereum object.");
        }
    }

    useEffect(() => {
        checkIfWalletIsConnected();
        checkIfTransactionsExist();
    }, []);

    return (
        <TransactionContext.Provider
            value={{connectedAccount, connectWallet, sendTransaction, formData, setFormData, transactions, transactionCount, handleChange, loading}}>
            {children}
        </TransactionContext.Provider>
    )
}