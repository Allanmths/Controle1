import React, { useState, useEffect } from 'react';
import { FaLightbulb, FaTimes, FaArrowRight, FaArrowLeft } from 'react-icons/fa';

const TourSteps = {
    dashboard: [
        {
            target: '[data-tour="dashboard-charts"]',
            title: 'Gráficos Interativos',
            content: 'Visualize suas movimentações de estoque em diferentes formatos de gráfico.',
            position: 'bottom'
        },
        {
            target: '[data-tour="dashboard-alerts"]',
            title: 'Alertas de Estoque',
            content: 'Monitore produtos com estoque baixo em tempo real.',
            position: 'left'
        }
    ],
    stock: [
        {
            target: '[data-tour="stock-filters"]',
            title: 'Filtros AvanÃ§ados',
            content: 'Use os filtros para encontrar produtos rapidamente por nome, categoria ou local.',
            position: 'bottom'
        },
        {
            target: '[data-tour="stock-actions"]',
            title: 'AÃ§Ãµes RÃ¡pidas',
            content: 'Edite, exclua ou visualize detalhes dos produtos com um clique.',
            position: 'left'
        }
    ],
    registers: [
        {
            target: '[data-tour="register-tabs"]',
            title: 'Abas de Cadastro',
            content: 'Organize seus cadastros em abas: Produtos, Categorias e Localidades.',
            position: 'bottom'
        },
        {
            target: '[data-tour="add-product"]',
            title: 'Novo Produto',
            content: 'Adicione produtos com estoque por localidade e informaÃ§Ãµes completas.',
            position: 'bottom'
        }
    ]
};

const OnboardingTour = ({ page, onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const steps = TourSteps[page] || [];

    useEffect(() => {
        const hasSeenTour = localStorage.getItem(`tour-${page}-completed`);
        if (!hasSeenTour && steps.length > 0) {
            setTimeout(() => setIsActive(true), 1000);
        }
    }, [page, steps.length]);

    const completeTour = () => {
        localStorage.setItem(`tour-${page}-completed`, 'true');
        setIsActive(false);
        onComplete?.();
    };

    const nextStep = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            completeTour();
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const skipTour = () => {
        completeTour();
    };

    if (!isActive || steps.length === 0) return null;

    const currentStepData = steps[currentStep];

    return (
        <>
            {/* Overlay */}
            <div className="fixed inset-0 bg-black bg-opacity-50 z-40" />
            
            {/* Tour Popup */}
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl max-w-md w-full mx-4 z-50">
                <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center">
                            <FaLightbulb className="w-5 h-5 text-yellow-500 mr-2" />
                            <h3 className="text-lg font-semibold">{currentStepData.title}</h3>
                        </div>
                        <button
                            onClick={skipTour}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <FaTimes />
                        </button>
                    </div>
                    
                    <p className="text-gray-600 mb-6">{currentStepData.content}</p>
                    
                    <div className="flex items-center justify-between">
                        <div className="flex space-x-1">
                            {steps.map((_, index) => (
                                <div
                                    key={index}
                                    className={`w-2 h-2 rounded-full ${
                                        index === currentStep ? 'bg-blue-500' : 'bg-gray-300'
                                    }`}
                                />
                            ))}
                        </div>
                        
                        <div className="flex space-x-2">
                            {currentStep > 0 && (
                                <button
                                    onClick={prevStep}
                                    className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-800"
                                >
                                    <FaArrowLeft className="w-4 h-4 mr-1" />
                                    Anterior
                                </button>
                            )}
                            
                            <button
                                onClick={nextStep}
                                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                {currentStep === steps.length - 1 ? 'Concluir' : 'PrÃ³ximo'}
                                {currentStep < steps.length - 1 && <FaArrowRight className="w-4 h-4 ml-1" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

const HelpTooltip = ({ children, content, position = 'top' }) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div className="relative inline-block">
            <div
                onMouseEnter={() => setIsVisible(true)}
                onMouseLeave={() => setIsVisible(false)}
            >
                {children}
            </div>
            
            {isVisible && (
                <div className={`absolute z-10 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg whitespace-nowrap ${
                    position === 'top' ? 'bottom-full mb-2' : 
                    position === 'bottom' ? 'top-full mt-2' :
                    position === 'left' ? 'right-full mr-2' : 'left-full ml-2'
                }`}>
                    {content}
                    <div className={`absolute w-2 h-2 bg-gray-900 transform rotate-45 ${
                        position === 'top' ? 'top-full left-1/2 -translate-x-1/2 -mt-1' :
                        position === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 -mb-1' :
                        position === 'left' ? 'left-full top-1/2 -translate-y-1/2 -ml-1' : 'right-full top-1/2 -translate-y-1/2 -mr-1'
                    }`} />
                </div>
            )}
        </div>
    );
};

export { OnboardingTour, HelpTooltip };
