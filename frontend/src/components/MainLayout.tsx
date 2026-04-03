/**
 * Main layout component with Ionic navigation
 */
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonMenu,
  IonMenuButton,
  IonList,
  IonItem,
  IonLabel,
  IonMenuToggle,
} from '@ionic/react';
import {
  homeOutline,
  walletOutline,
  listOutline,
  statsChartOutline,
  logOutOutline,
  repeatOutline,
  bulbOutline,
  chatbubbleEllipsesOutline,
} from 'ionicons/icons';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { NotificationBell } from './NotificationBell';

export const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>💰 Finance Coach</IonTitle>
          <IonButtons slot="end">
            <NotificationBell />
            <IonButton onClick={handleLogout}>
              <IonIcon slot="icon-only" icon={logOutOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonMenu contentId="main-content" type="overlay">
        <IonHeader>
          <IonToolbar color="primary">
            <IonTitle>Menu</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <IonList>
            <IonMenuToggle autoHide={false}>
              <IonItem button routerLink="/dashboard" routerDirection="none">
                <IonIcon slot="start" icon={homeOutline} />
                <IonLabel>Dashboard</IonLabel>
              </IonItem>
              <IonItem button routerLink="/accounts" routerDirection="none">
                <IonIcon slot="start" icon={walletOutline} />
                <IonLabel>Accounts</IonLabel>
              </IonItem>
              <IonItem button routerLink="/transactions" routerDirection="none">
                <IonIcon slot="start" icon={listOutline} />
                <IonLabel>Transactions</IonLabel>
              </IonItem>
              <IonItem button routerLink="/budgets" routerDirection="none">
                <IonIcon slot="start" icon={statsChartOutline} />
                <IonLabel>Budgets</IonLabel>
              </IonItem>
              <IonItem button routerLink="/recurring" routerDirection="none">
                <IonIcon slot="start" icon={repeatOutline} />
                <IonLabel>Recurring</IonLabel>
              </IonItem>
              <IonItem button routerLink="/reports" routerDirection="none">
                <IonIcon slot="start" icon={statsChartOutline} />
                <IonLabel>Reports</IonLabel>
              </IonItem>
              <IonItem button routerLink="/insights" routerDirection="none">
                <IonIcon slot="start" icon={bulbOutline} />
                <IonLabel>AI Insights</IonLabel>
              </IonItem>
              <IonItem button routerLink="/ai-coach" routerDirection="none">
                <IonIcon slot="start" icon={chatbubbleEllipsesOutline} />
                <IonLabel>AI Coach</IonLabel>
              </IonItem>
            </IonMenuToggle>
            <IonItem lines="none" className="ion-padding-top">
              <IonLabel className="ion-text-wrap">
                <p className="text-sm text-gray-600">{user?.email}</p>
              </IonLabel>
            </IonItem>
          </IonList>
        </IonContent>
      </IonMenu>

      <IonContent id="main-content" className="ion-padding">
        {children}
      </IonContent>
    </IonPage>
  );
};
