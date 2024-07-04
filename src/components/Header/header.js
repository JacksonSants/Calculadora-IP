import React from 'react';
import '@fortawesome/fontawesome-free/css/all.css';

import logo from '../../assets/logo.png'
import './styles.css';

const  Header = () => {
  return (
    <header className='header'>
        <nav className='nav-list'>
            <li className='list-item logo'>
                <a href='#logo' className='item'><img src={logo} alt='logo'/></a>
            </li>

            <li className='list-item profile'>
                <a href='#hme' className='item'><i class="fa-solid fa-user"></i> Profile</a>
            </li>
        </nav>
    </header>
  );
}

export { Header }