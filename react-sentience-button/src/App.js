import {
  SentienceButton,
  useAccount,
  useSDK,
  useSignMessage,
} from '@sntns/sdk-react-ui';
import './App.css';

function AppReady() {
  const {
    data: signData,
    isError: isSignError,
    isLoading: isSignLoading,
    isSuccess: isSignSuccess,
    signMessage,
  } = useSignMessage({
    message: 'gm wagmi frens',
  });

  const { isConnected } = useAccount();

  return (
    <div className="App">
      <header className="App-header">
        <span>
          {/* TODO: Remove once we fix this issue */}
          <p>
            This is example dapp is currently flagged as a work in progress due
            to a recently found bug. Please be advised.
          </p>
        </span>
        <SentienceButton theme={'light'} color="white"></SentienceButton>
        {isConnected && (
          <>
            <div style={{ marginTop: 20 }}>
              <button disabled={isSignLoading} onClick={() => signMessage()}>
                Sign message
              </button>
              {isSignSuccess && <div>Signature: {signData}</div>}
              {isSignError && <div>Error signing message</div>}
            </div>
          </>
        )}
      </header>
    </div>
  );
}

function App() {
  const { ready } = useSDK();

  if (!ready) {
    return <div>Loading...</div>;
  }

  return <AppReady />;
}

export default App;
