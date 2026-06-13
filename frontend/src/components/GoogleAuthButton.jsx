import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

/**
 * Renders the official Google Sign-In button and wires it to the auth store.
 * On success, navigates to `redirectTo` (default: /dashboard).
 */
const GoogleAuthButton = ({ redirectTo = '/dashboard', text = 'continue_with' }) => {
  const { loginWithGoogle } = useAuthStore();
  const navigate = useNavigate();

  const handleSuccess = async (credentialResponse) => {
    const credential = credentialResponse?.credential;
    if (!credential) return;
    const ok = await loginWithGoogle(credential);
    if (ok) navigate(redirectTo);
  };

  return (
    <div className="flex justify-center w-full [&>div]:w-full">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => useAuthStore.setState({ error: 'Connexion Google annulée ou échouée.' })}
        text={text}
        shape="rectangular"
        size="large"
        width="100%"
        locale="fr"
      />
    </div>
  );
};

export default GoogleAuthButton;
