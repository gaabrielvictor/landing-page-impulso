import React from 'react';
import Header from '../components/Header';
import HowItWorks from '../components/HowItWorks';
import Footer from '../components/Footer';
import '../styles/ComoFunciona.css';

const ComoFunciona = () => {
  return (
    <div className="como-funciona-page">
      <Header />
      <main className="como-funciona-main">
        <HowItWorks />
      </main>
      <Footer />
    </div>
  );
};

export default ComoFunciona;
