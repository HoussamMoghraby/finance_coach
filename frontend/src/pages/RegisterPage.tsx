/**
 * Register page
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
  IonCardContent,
} from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      await register(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Wentaro AI</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding" fullscreen>
        <div className="flex flex-col items-center justify-center min-h-full">
          <IonCard className="w-full max-w-md">
            <IonCardHeader>
              <div className="text-center">
                <IonCardTitle className="text-2xl font-bold">Create your account</IonCardTitle>
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

                <IonItem className="mb-4">
                  <IonLabel position="stacked">Password</IonLabel>
                  <IonInput
                    type="password"
                    value={password}
                    onIonInput={(e) => setPassword((e.target as HTMLIonInputElement).value as string)}
                    required
                    placeholder="Enter your password"
                  />
                </IonItem>

                <IonItem className="mb-6">
                  <IonLabel position="stacked">Confirm Password</IonLabel>
                  <IonInput
                    type="password"
                    value={confirmPassword}
                    onIonInput={(e) => setConfirmPassword((e.target as HTMLIonInputElement).value as string)}
                    required
                    placeholder="Confirm your password"
                  />
                </IonItem>

                <IonButton
                  expand="block"
                  type="submit"
                  disabled={loading}
                  color="primary"
                  className="mb-4"
                >
                  {loading ? 'Creating account...' : 'Create account'}
                </IonButton>

                <div className="text-center">
                  <IonButton
                    fill="clear"
                    routerLink="/login"
                    size="small"
                  >
                    Already have an account? Sign in
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
