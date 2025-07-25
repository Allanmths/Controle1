import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

const useFirestore = (collectionName, options) => {
    const [docs, setDocs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); // Adiciona estado para o erro

    // Use JSON.stringify to create a stable dependency from the options object,
    // preventing infinite loops if the options object is redefined on every render.
    const stableOptions = JSON.stringify(options);

    useEffect(() => {
        setError(null); // Reseta o erro a cada nova execuÃ§Ã£o
        try {
            let q = query(collection(db, collectionName));

            // Parse the stable options back to an object to use it
            const currentOptions = stableOptions ? JSON.parse(stableOptions) : null;

            if (currentOptions?.field) {
                const direction = currentOptions.direction || 'asc';
                q = query(q, orderBy(currentOptions.field, direction));
            }

            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                const documents = [];
                querySnapshot.forEach((doc) => {
                    documents.push({ ...doc.data(), id: doc.id });
                });
                setDocs(documents);
                setLoading(false);
            }, (err) => { // Altera para 'err' para evitar sombreamento
                console.error(`Erro ao buscar dados de '${collectionName}': `, err);
                setError(err); // Define o estado de erro
                setDocs([]);
                setLoading(false);
            });

            return () => unsubscribe();
        } catch (err) { // Altera para 'err' para evitar sombreamento
            console.error(`Erro ao configurar o listener do Firestore para '${collectionName}':`, err);
            setError(err); // Define o estado de erro
            setDocs([]);
            setLoading(false);
        }

    }, [collectionName, stableOptions]); // Now the effect correctly re-runs when options change

    return { docs, loading, error }; // Retorna o estado de erro
};

export default useFirestore;
