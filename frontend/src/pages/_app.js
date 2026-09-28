import '@/styles/globals.css';
import { Provider } from 'react-redux';
import { wrapper } from '@/config/redux/store'; // 🔧 Use wrapper instead of direct store import
import '@fortawesome/fontawesome-free/css/all.min.css';

function MyApp({ Component, ...rest }) {
  const { store, props } = wrapper.useWrappedStore(rest); // 🔧 Correct usage for SSR support

  return (
    <Provider store={store}>
      <Component {...props.pageProps} />
    </Provider>
  );
}

export default MyApp;
