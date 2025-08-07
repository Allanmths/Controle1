import { db } from '../services/firebase';
import { collection, doc, setDoc, getDocs } from 'firebase/firestore';
import { ROLES } from '../utils/permissions';

export const createDemoUsers = async () => {
  const demoUsers = [
    {
      id: 'demo-admin',
      email: 'admin@demo.com',
      displayName: 'Administrador Demo',
      role: ROLES.ADMIN,
      isActive: true,
      createdAt: new Date('2024-01-15'),
      lastLogin: new Date('2025-01-19'),
      customPermissions: []
    },
    {
      id: 'demo-manager',
      email: 'manager@demo.com',
      displayName: 'Gerente Demo',
      role: ROLES.MANAGER,
      isActive: true,
      createdAt: new Date('2024-02-10'),
      lastLogin: new Date('2025-01-18'),
      customPermissions: ['view_audit']
    },
    {
      id: 'demo-editor',
      email: 'editor@demo.com',
      displayName: 'Editor Demo',
      role: ROLES.EDITOR,
      isActive: true,
      createdAt: new Date('2024-03-05'),
      lastLogin: new Date('2025-01-17'),
      customPermissions: []
    },
    {
      id: 'demo-user',
      email: 'usuário@demo.com',
      displayName: 'UsuÃ¡rio Demo',
      role: ROLES.USER,
      isActive: true,
      createdAt: new Date('2024-04-20'),
      lastLogin: new Date('2025-01-16'),
      customPermissions: []
    },
    {
      id: 'demo-viewer',
      email: 'viewer@demo.com',
      displayName: 'Visualizador Demo',
      role: ROLES.VIEWER,
      isActive: false,
      createdAt: new Date('2024-05-12'),
      lastLogin: new Date('2024-12-15'),
      customPermissions: []
    },
    {
      id: 'demo-inactive',
      email: 'inativo@demo.com',
      displayName: 'UsuÃ¡rio Inativo',
      role: ROLES.USER,
      isActive: false,
      createdAt: new Date('2024-06-01'),
      lastLogin: new Date('2024-11-20'),
      customPermissions: []
    }
  ];

  try {
    const usersRef = collection(db, 'users');
    
    // Verificar se jÃ¡ existem usuÃ¡rios demo
    const snapshot = await getDocs(usersRef);
    const existingEmails = snapshot.docs.map(doc => doc.data().email);
    
    for (const user of demoUsers) {
      // SÃ³ criar se nÃ£o existir
      if (!existingEmails.includes(user.email)) {
        const userRef = doc(db, 'users', user.id);
        await setDoc(userRef, user);
        console.log(`UsuÃ¡rio demo criado: ${user.email}`);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao criar usuÃ¡rios demo:', error);
    return false;
  }
};

export const checkAndCreateDemoUsers = async () => {
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    
    // Se hÃ¡ menos de 3 usuÃ¡rios, criar dados demo
    if (snapshot.docs.length < 3) {
      await createDemoUsers();
    }
  } catch (error) {
    console.error('Erro ao verificar usuÃ¡rios:', error);
  }
};
