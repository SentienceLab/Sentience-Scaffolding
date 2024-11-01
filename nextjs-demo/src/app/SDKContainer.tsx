'use client'; // This is a client component 👈🏽

import { SentienceSDK, SDKProvider } from '@sntns/sdk';
import {
  ConnectionStatus,
  EventType,
  ServiceStatus,
} from '@sntns/sdk-communication-layer';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import './SDKContainer.css';
import {
  send_eth_signTypedData_v4,
  send_personal_sign,
} from '@/app/SignHelpers';

declare global {
  interface Window {
    sentience?: SDKProvider;
  }
}

export default function SDKContainer() {
  const [sdk, setSDK] = useState<SentienceSDK>();
  const [chain, setChain] = useState('');
  const [account, setAccount] = useState<string>('');
  const [response, setResponse] = useState<any>('');
  const [connected, setConnected] = useState(false);
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus>();
  const [activeProvider, setActiveProvider] = useState<SDKProvider>();
  const [currentLanguage, setCurrentLanguage] = useState(
    localStorage.getItem('SentienceSDKLng') || 'en',
  );

  const languages = sdk?.availableLanguages ?? ['en'];

  const changeLanguage = async (currentLanguage: string) => {
    localStorage.setItem('SentienceSDKLng', currentLanguage);
    window.location.reload();
  };

  const handleLanguageChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setCurrentLanguage(event.target.value);

    changeLanguage(event.target.value).then(() => {
      console.debug(`language changed to ${event.target.value}`);
    });
  };

  useEffect(() => {
    const doAsync = async () => {
      const clientSDK = new SentienceSDK({
        useDeeplink: false,
        communicationServerUrl: process.env.NEXT_PUBLIC_COMM_SERVER_URL,
        checkInstallationImmediately: false,
        i18nOptions: {
          enabled: true,
        },
        dappMetadata: {
          name: 'Sentience NEXTJS demo',
          url: 'https://localhost:3000',
        },
        logging: {
          developerMode: false,
        },
        storage: {
          enabled: true,
        },
      });
      await clientSDK.init();
      setSDK(clientSDK);
    };
    doAsync();
  }, []);

  useEffect(() => {
    if (!sdk || !activeProvider) {
      return;
    }

    // activeProvider is mapped to window.sentience.
    console.debug(`App::useEffect setup active provider listeners`);
    if (window.sentience?.getSelectedAddress()) {
      console.debug(`App::useEffect setting account from window.sentience `);
      setAccount(window.sentience?.getSelectedAddress() ?? '');
      setConnected(true);
    } else {
      setConnected(false);
    }

    const onChainChanged = (chain: unknown) => {
      console.log(`App::useEfect on 'chainChanged'`, chain);
      setChain(chain as string);
      setConnected(true);
    };

    const onInitialized = () => {
      console.debug(`App::useEffect on _initialized`);
      setConnected(true);
      if (window.sentience?.getSelectedAddress()) {
        setAccount(window.sentience?.getSelectedAddress() ?? '');
      }

      if (window.sentience?.getChainId()) {
        setChain(window.sentience.getChainId());
      }
    };

    const onAccountsChanged = (accounts: unknown) => {
      console.log(`App::useEfect on 'accountsChanged'`, accounts);
      setAccount((accounts as string[])?.[0]);
      setConnected(true);
    };

    const onConnect = (_connectInfo: any) => {
      console.log(`App::useEfect on 'connect'`, _connectInfo);
      setConnected(true);
      setChain(_connectInfo.chainId as string);
    };

    const onDisconnect = (error: unknown) => {
      console.log(`App::useEfect on 'disconnect'`, error);
      setConnected(false);
      setChain('');
    };

    const onServiceStatus = (_serviceStatus: ServiceStatus) => {
      console.debug(`sdk connection_status`, _serviceStatus);
      setServiceStatus(_serviceStatus);
    };

    window.sentience?.on('chainChanged', onChainChanged);

    window.sentience?.on('_initialized', onInitialized);

    window.sentience?.on('accountsChanged', onAccountsChanged);

    window.sentience?.on('connect', onConnect);

    window.sentience?.on('disconnect', onDisconnect);

    sdk.on(EventType.SERVICE_STATUS, onServiceStatus);

    return () => {
      console.debug(`App::useEffect cleanup activeprovider events`);
      window.sentience?.removeListener('chainChanged', onChainChanged);
      window.sentience?.removeListener('_initialized', onInitialized);
      window.sentience?.removeListener('accountsChanged', onAccountsChanged);
      window.sentience?.removeListener('connect', onConnect);
      window.sentience?.removeListener('disconnect', onDisconnect);
      sdk.removeListener(EventType.SERVICE_STATUS, onServiceStatus);
    };
  }, [activeProvider]);

  useEffect(() => {
    if (!sdk?.isInitialized()) {
      return;
    }

    const onProviderEvent = (accounts?: string[]) => {
      if (accounts?.[0]?.startsWith('0x')) {
        setConnected(true);
        setAccount(accounts?.[0]);
      } else {
        setConnected(false);
        setAccount('');
      }
      setActiveProvider(sdk.getProvider());
    };
    // listen for provider change events
    sdk.on(EventType.PROVIDER_UPDATE, onProviderEvent);
    return () => {
      sdk.removeListener(EventType.PROVIDER_UPDATE, onProviderEvent);
    };
  }, [sdk]);

  const connect = () => {
    if (!window.sentience) {
      throw new Error(`invalid sentience provider`);
    }

    window.sentience
      .request({
        method: 'eth_requestAccounts',
        params: [],
      })
      .then((accounts) => {
        if (accounts) {
          console.debug(`connect:: accounts result`, accounts);
          setAccount((accounts as string[])[0]);
          setConnected(true);
        }
      })
      .catch((e) => console.log('request accounts ERR', e));
  };

  const connectAndSign = async () => {
    try {
      const signResult = await sdk?.connectAndSign({
        msg: 'Connect + Sign message',
      });
      setResponse(signResult);
      setAccount(window.sentience?.getSelectedAddress() ?? '');
      setConnected(true);
      setChain(window.sentience?.getChainId() ?? '');
    } catch (err) {
      console.warn(`failed to connect..`, err);
    }
  };

  const eth_signTypedData_v4 = async () => {
    if (!activeProvider || !activeProvider.getChainId()) {
      setResponse(`invalid sentience provider`);
      return;
    }
    const result = await send_eth_signTypedData_v4(
      activeProvider,
      activeProvider.getChainId(),
    );
    setResponse(result);
  };

  const eth_personal_sign = async () => {
    if (!activeProvider) {
      setResponse(`invalid sentience provider`);
      return;
    }
    const result = await send_personal_sign(activeProvider);
    setResponse(result);
  };

  const sendTransaction = async () => {
    const to = '0x0000000000000000000000000000000000000000';
    const transactionParameters = {
      to, // Required except during contract publications.
      from: activeProvider?.getSelectedAddress(), // must match user's active address.
      value: '0x5AF3107A4000', // Only required to send ether to the recipient from the initiating external account.
    };

    try {
      // txHash is a hex string
      // As with any RPC call, it may throw an error
      const txHash = (await activeProvider?.request({
        method: 'eth_sendTransaction',
        params: [transactionParameters],
      })) as string;

      setResponse(txHash);
    } catch (e) {
      console.log(e);
    }
  };

  const changeNetwork = async (hexChainId: string) => {
    console.debug(`switching to network chainId=${hexChainId}`);
    try {
      const response = await activeProvider?.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: hexChainId }], // chainId must be in hexadecimal numbers
      });
      console.debug(`response`, response);
    } catch (err) {
      console.error(err);
    }
  };

  const addethereumChain = () => {
    if (!activeProvider) {
      throw new Error(`invalid sentience provider`);
    }

    activeProvider
      .request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: '0x89',
            chainName: 'Polygon',
            blockExplorerUrls: ['https://polygonscan.com'],
            nativeCurrency: { symbol: 'MATIC', decimals: 18 },
            rpcUrls: ['https://polygon-rpc.com/'],
          },
        ],
      })
      .then((res) => console.log('add', res))
      .catch((e) => console.log('ADD ERR', e));
  };

  const readOnlyCalls = async () => {
    if (!sdk?.hasReadOnlyRPCCalls() && window.sentience === undefined) {
      setResponse(
        'readOnlyCalls are not set and provider is not set. Please set your infuraAPIKey in the SDK Options',
      );
      return;
    }
    try {
      const result = await window.sentience?.request({
        method: 'eth_blockNumber',
        params: [],
      });
      console.log(`got blockNumber`, result);
      const gotFrom = sdk!!.hasReadOnlyRPCCalls()
        ? 'infura'
        : 'Sentience provider';
      setResponse(`(${gotFrom}) ${result}`);
    } catch (e) {
      console.log(`error getting the blockNumber`, e);
      setResponse('error getting the blockNumber');
    }
  };

  const terminate = () => {
    sdk?.terminate();
    setChain('');
    setAccount('');
    setResponse('');
  };

  return (
    <>
      <Head>
        <title>Sentience Next App</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main style={{ textAlign: 'center' }}>
        <h1>Sentience NextJS Example</h1>
        <div className="language-dropdown">
          <label htmlFor="language-select">Language: </label>
          <select
            id="language-select"
            value={currentLanguage}
            onChange={handleLanguageChange}
          >
            {languages.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>
        <div className={'info-section'}>
          <>
            {`Connected chain: ${chain}`}
            <p></p>
            {`Connected account: ${account}`}
            <p></p>
            {`Response: ${response}`}
            <p></p>
            {`Connected: ${connected}`}

            {serviceStatus?.connectionStatus === ConnectionStatus.WAITING && (
              <div>Waiting for Sentience to link the connection...</div>
            )}
            <p>ChannelId: {serviceStatus?.channelConfig?.channelId}</p>
            <p>{`Expiration: ${serviceStatus?.channelConfig?.validUntil ?? ''}`}</p>
          </>
        </div>

        <div style={{ textAlign: 'center' }}>
          {connected ? (
            <div>
              <button
                className={'button-normal'}
                style={{ padding: 10, margin: 10 }}
                onClick={connect}
              >
                Request Accounts
              </button>

              <button
                className={'button-normal'}
                style={{ padding: 10, margin: 10 }}
                onClick={eth_signTypedData_v4}
              >
                eth_signTypedData_v4
              </button>

              <button
                className={'button-normal'}
                style={{ padding: 10, margin: 10 }}
                onClick={eth_personal_sign}
              >
                personal_sign
              </button>

              <button
                className={'button-normal'}
                style={{ padding: 10, margin: 10 }}
                onClick={sendTransaction}
              >
                Send Transaction
              </button>

              {activeProvider?.getChainId() === '0x1' ? (
                <button
                  className={'button-normal'}
                  style={{ padding: 10, margin: 10 }}
                  onClick={() => changeNetwork('0x5')}
                >
                  Switch to Goerli
                </button>
              ) : (
                <button
                  className={'button-normal'}
                  style={{ padding: 10, margin: 10 }}
                  onClick={() => changeNetwork('0x1')}
                >
                  Switch to Mainnet
                </button>
              )}

              <button
                className={'button-normal'}
                style={{ padding: 10, margin: 10 }}
                onClick={addethereumChain}
              >
                Add Polygon
              </button>

              <button
                className={'button-normal'}
                style={{ padding: 10, margin: 10 }}
                onClick={() => changeNetwork('0x89')}
              >
                Switch to Polygon
              </button>

              <button
                className={'button-normal'}
                style={{ padding: 10, margin: 10 }}
                onClick={readOnlyCalls}
              >
                readOnlyCalls
              </button>
            </div>
          ) : (
            <>
              <button
                className={'button-normal'}
                style={{ padding: 10, margin: 10 }}
                onClick={connect}
              >
                Connect
              </button>

              <button
                className={'button-normal'}
                style={{ padding: 10, margin: 10 }}
                onClick={connectAndSign}
              >
                Connect w/ Sign
              </button>
            </>
          )}

          <button
            className={'button-danger'}
            style={{ padding: 10, margin: 10, backgroundColor: 'red' }}
            onClick={terminate}
          >
            Terminate
          </button>
        </div>
      </main>
    </>
  );
}
