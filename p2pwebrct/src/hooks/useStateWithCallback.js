import {useState, useCallback, useRef, useEffect} from "react";

const useStateWithCallback = initialState => {
    const [state, setState] = useState(initialState);
    const cbRef = useRef(null); //збереження колбеку


    const updateState = useCallback((newState, cb) =>
    {
        cbRef.current = cb; //колбек, який прийшов зі станом
        //оновлення функції
        setState(prev => typeof newState === 'function' ? newState(prev) : newState);
    }, []);

    //при зміні стану вертає стан і після цього скидаємо в нал
    useEffect( () => {
        if (cbRef.current){
            cbRef.current(state);
            cbRef.current = null;
        }
    }, [state]);

    return [state, updateState];
}

export default useStateWithCallback;
