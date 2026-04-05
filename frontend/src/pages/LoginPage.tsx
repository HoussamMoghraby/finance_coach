/**
 * Login page
 */
import { useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonText,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
} from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import wentaroLogo from '@/wentaro-logo-square-2.png';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Attempting login with:', { email, password });
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      {/* <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Wentaro AI</IonTitle>
        </IonToolbar>
      </IonHeader> */}
      <IonContent className="ion-padding" fullscreen>
        <div className="flex flex-col items-center justify-center min-h-full">
          {/* Logo */}
          <div className="mb-4 text-center">
            <img
              src={wentaroLogo}
              alt="Wentaro AI Logo"
              className="w-24 h-24 object-contain mx-auto mb-3"
            />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
              Wentaro AI
            </h1>
            <p className="text-sm text-gray-500 mt-2">Your Personal Finance Coach</p>
          </div>

          <IonCard className="w-full max-w-md">
            <IonCardHeader>
              <div className="text-center">
                <IonCardSubtitle className="text-base">Sign in to your account</IonCardSubtitle>
              </div>
            </IonCardHeader>
            <IonCardContent>
              <form onSubmit={handleSubmit}>
                {error && (
                  <div className="ion-padding rounded-md bg-red-50 mb-4">
                    <IonText color="danger">
                      <p className="text-sm">{error}</p>
                    </IonText>
                  </div>
                )}

                <IonItem className="mb-4">
                  <IonLabel position="stacked">Email</IonLabel>
                  <IonInput
                    type="email"
                    value={email}
                    onIonInput={(e) => setEmail((e.target as HTMLIonInputElement).value as string)}
                    required
                    placeholder="Enter your email"
                  />
                </IonItem>

                <IonItem className="mb-6">
                  <IonLabel position="stacked">Password</IonLabel>
                  <IonInput
                    type="password"
                    value={password}
                    onIonInput={(e) => setPassword((e.target as HTMLIonInputElement).value as string)}
                    required
                    placeholder="Enter your password"
                  />
                </IonItem>

                <IonButton
                  expand="block"
                  type="submit"
                  disabled={loading}
                  color="primary"
                  className="mb-4"
                >
                  {loading ? 'Signing in...' : 'Sign in'}
                </IonButton>

                <div className="text-center">
                  <IonButton
                    fill="clear"
                    routerLink="/register"
                    size="small"
                  >
                    Don't have an account? Register
                  </IonButton>
                </div>
              </form>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};
