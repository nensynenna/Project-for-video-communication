import './index.css';
import {BrowserRouter, Route, Routes} from 'react-router-dom';
import Room from './pages/Room';
import Main from './pages/Main';
import NotFound404 from './pages/NotFound404';

function App() {
  return (
    // налаштовуємо доступ до сторінок
    <BrowserRouter>
      <Routes>
        <Route exact path='/room/:id' Component={Room}/>
        <Route exact path='/' Component={Main}/>
        <Route path='*' Component={NotFound404}/>
        <Route></Route>
      </Routes>
    </BrowserRouter>

  );
}

export default App;
