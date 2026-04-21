// Text-to-speech utility
function speak(text: string) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utter = new window.SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utter);
  }
}
// Helper to parse user input into blocks
function parseBlocks(input: string) {
  return input.split(/\s+/).filter(Boolean).map((text, idx) => ({ id: idx + 1, text }));
}
  // Custom challenge builder state
  const [customPrompt, setCustomPrompt] = useState('');
  const [customBlocksInput, setCustomBlocksInput] = useState('');
  const [customBlocks, setCustomBlocks] = useState<{ id: number; text: string }[]>([]);
  const [customOrder, setCustomOrder] = useState<number[]>([]);
  const [customActive, setCustomActive] = useState(false);
  const [customFeedback, setCustomFeedback] = useState('');
  const [customSolved, setCustomSolved] = useState(false);
  function startCustomChallenge() {
    const blocks = parseBlocks(customBlocksInput);
    if (!customPrompt.trim() || blocks.length < 2) {
      setCustomFeedback('Please enter a prompt and at least two code blocks.');
      return;
    }
    setCustomBlocks(blocks);
    setCustomOrder(blocks.map(b => b.id).sort(() => Math.random() - 0.5));
    setCustomActive(true);
    setCustomFeedback('');
    setCustomSolved(false);
  }

  function moveCustomBlock(idx: number, direction: -1 | 1) {
    const newOrder = [...customOrder];
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= newOrder.length) return;
    [newOrder[idx], newOrder[targetIdx]] = [newOrder[targetIdx], newOrder[idx]];
    setCustomOrder(newOrder);
    setCustomFeedback('');
    setCustomSolved(false);
  }

  function checkCustomAnswer() {
    if (customOrder.join(',') === customBlocks.map(b => b.id).join(',')) {
      setCustomFeedback('✅ Correct!');
      setCustomSolved(true);
    } else {
      setCustomFeedback('❌ Not quite. Try rearranging the blocks.');
      setCustomSolved(false);
    }
  }


import './App.css'


import { useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProvided, DroppableStateSnapshot, DraggableProvided, DraggableStateSnapshot } from 'react-beautiful-dnd'

// Multilingual modules (English/Spanish)
const MODULES_EN = [
  {
    name: 'Variables',
    instruction: 'A variable stores a value you can use later. Example: let x = 5;',
    blocks: [
      { id: 1, text: 'let' },
      { id: 2, text: 'x' },
      { id: 3, text: '=' },
      { id: 4, text: '5' },
      { id: 5, text: ';' },
    ],
    correctOrder: [1, 2, 3, 4, 5],
    prompt: 'Assemble a variable declaration:',
    step: 'Step 1: What is a variable?',
    example: 'let x = 5; // Store the number 5 in x',
  },
  {
    name: 'Arrays',
    instruction: 'An array stores multiple values. Example: let arr = [1, 2, 3];',
    blocks: [
      { id: 1, text: 'let' },
      { id: 2, text: 'arr' },
      { id: 3, text: '=' },
      { id: 4, text: '[' },
      { id: 5, text: '1' },
      { id: 6, text: ',' },
      { id: 7, text: '2' },
      { id: 8, text: ',' },
      { id: 9, text: '3' },
      { id: 10, text: ']' },
      { id: 11, text: ';' },
    ],
    correctOrder: [1,2,3,4,5,6,7,8,9,10,11],
    prompt: 'Assemble an array declaration:',
    step: 'Step 2: What is an array?',
    example: 'let arr = [1, 2, 3]; // An array of numbers',
  },
  {
    name: 'Loops',
    instruction: 'A loop repeats code. Example: for (let i = 0; i < 3; i++) { ... }',
    blocks: [
      { id: 1, text: 'for' },
      { id: 2, text: '(' },
      { id: 3, text: 'let' },
      { id: 4, text: 'i' },
      { id: 5, text: '=' },
      { id: 6, text: '0' },
      { id: 7, text: ';' },
      { id: 8, text: 'i' },
      { id: 9, text: '<' },
      { id: 10, text: '3' },
      { id: 11, text: ';' },
      { id: 12, text: 'i++' },
      { id: 13, text: ')' },
      { id: 14, text: '{' },
      { id: 15, text: '}' },
    ],
    correctOrder: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
    prompt: 'Assemble a for loop:',
    step: 'Step 3: What is a loop?',
    example: 'for (let i = 0; i < 3; i++) { /* ... */ } // Loop 3 times',
  },
  {
    name: 'Conditionals',
    instruction: 'Conditionals let you run code only if something is true. Example: if (x > 0) { ... }',
    blocks: [
      { id: 1, text: 'if' },
      { id: 2, text: '(' },
      { id: 3, text: 'x' },
      { id: 4, text: '>' },
      { id: 5, text: '0' },
      { id: 6, text: ')' },
      { id: 7, text: '{' },
      { id: 8, text: '}' },
    ],
    correctOrder: [1,2,3,4,5,6,7,8],
    prompt: 'Assemble an if statement:',
    step: 'Step 4: What is a conditional?',
    example: 'if (x > 0) { /* ... */ } // Run code if x is positive',
  },
  {
    name: 'Functions',
    instruction: 'A function groups code to run later. Example: function greet() { ... }',
    blocks: [
      { id: 1, text: 'function' },
      { id: 2, text: 'greet' },
      { id: 3, text: '(' },
      { id: 4, text: ')' },
      { id: 5, text: '{' },
      { id: 6, text: '}' },
    ],
    correctOrder: [1,2,3,4,5,6],
    prompt: 'Assemble a function declaration:',
    step: 'Step 5: What is a function?',
    example: 'function greet() { /* ... */ } // A function named greet',
  },
  {
    name: 'Objects',
    instruction: 'An object groups related values. Example: const obj = { a: 1 }',
    blocks: [
      { id: 1, text: 'const' },
      { id: 2, text: 'obj' },
      { id: 3, text: '=' },
      { id: 4, text: '{' },
      { id: 5, text: 'a' },
      { id: 6, text: ':' },
      { id: 7, text: '1' },
      { id: 8, text: '}' },
      { id: 9, text: ';' },
    ],
    correctOrder: [1,2,3,4,5,6,7,8,9],
    prompt: 'Assemble an object declaration:',
    step: 'Step 6: What is an object?',
    example: 'const obj = { a: 1 }; // Object with property a',
  },
  {
    name: 'Final Challenge',
    instruction: 'Combine what you learned: let nums = [1,2,3]; for (let i = 0; i < nums.length; i++) { if (nums[i] > 1) { ... } }',
    blocks: [
      { id: 1, text: 'let' },
      { id: 2, text: 'nums' },
      { id: 3, text: '=' },
      { id: 4, text: '[' },
      { id: 5, text: '1' },
      { id: 6, text: ',' },
      { id: 7, text: '2' },
      { id: 8, text: ',' },
      { id: 9, text: '3' },
      { id: 10, text: ']' },
      { id: 11, text: ';' },
      { id: 12, text: 'for' },
      { id: 13, text: '(' },
      { id: 14, text: 'let' },
      { id: 15, text: 'i' },
      { id: 16, text: '=' },
      { id: 17, text: '0' },
      { id: 18, text: ';' },
      { id: 19, text: 'i' },
      { id: 20, text: '<' },
      { id: 21, text: 'nums.length' },
      { id: 22, text: ';' },
      { id: 23, text: 'i++' },
      { id: 24, text: ')' },
      { id: 25, text: '{' },
      { id: 26, text: 'if' },
      { id: 27, text: '(' },
      { id: 28, text: 'nums[i]' },
      { id: 29, text: '>' },
      { id: 30, text: '1' },
      { id: 31, text: ')' },
      { id: 32, text: '{' },
      { id: 33, text: '...' },
      { id: 34, text: '}' },
      { id: 35, text: '}' },
      { id: 36, text: '}' },
    ],
    correctOrder: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36],
    prompt: 'Final Challenge: Assemble the full code!',
    step: 'Final Challenge: Combine all concepts',
    example: 'let nums = [1,2,3]; for (let i = 0; i < nums.length; i++) { if (nums[i] > 1) { /* ... */ } } // Loop and check values',
  },
];

const MODULES_ES = [
  {
    name: 'Variables',
    instruction: 'Una variable almacena un valor que puedes usar después. Ejemplo: let x = 5;',
    blocks: [
      { id: 1, text: 'let' },
      { id: 2, text: 'x' },
      { id: 3, text: '=' },
      { id: 4, text: '5' },
      { id: 5, text: ';' },
    ],
    correctOrder: [1, 2, 3, 4, 5],
    prompt: 'Arma una declaración de variable:',
    step: 'Paso 1: ¿Qué es una variable?',
    example: 'let x = 5; // Guarda el número 5 en x',
  },
  {
    name: 'Arrays',
    instruction: 'Un array almacena múltiples valores. Ejemplo: let arr = [1, 2, 3];',
    blocks: [
      { id: 1, text: 'let' },
      { id: 2, text: 'arr' },
      { id: 3, text: '=' },
      { id: 4, text: '[' },
      { id: 5, text: '1' },
      { id: 6, text: ',' },
      { id: 7, text: '2' },
      { id: 8, text: ',' },
      { id: 9, text: '3' },
      { id: 10, text: ']' },
      { id: 11, text: ';' },
    ],
    correctOrder: [1,2,3,4,5,6,7,8,9,10,11],
    prompt: 'Arma un array declaration:',
    step: 'Paso 2: ¿Qué es un array?',
    example: 'let arr = [1, 2, 3]; // Un array de números',
  },
  {
    name: 'Loops',
    instruction: 'Un bucle repite código. Ejemplo: for (let i = 0; i < 3; i++) { ... }',
    blocks: [
      { id: 1, text: 'for' },
      { id: 2, text: '(' },
      { id: 3, text: 'let' },
      { id: 4, text: 'i' },
      { id: 5, text: '=' },
      { id: 6, text: '0' },
      { id: 7, text: ';' },
      { id: 8, text: 'i' },
      { id: 9, text: '<' },
      { id: 10, text: '3' },
      { id: 11, text: ';' },
      { id: 12, text: 'i++' },
      { id: 13, text: ')' },
      { id: 14, text: '{' },
      { id: 15, text: '}' },
    ],
    correctOrder: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
    prompt: 'Arma un for loop:',
    step: 'Paso 3: ¿Qué es un bucle?',
    example: 'for (let i = 0; i < 3; i++) { /* ... */ } // Loop 3 veces',
  },
  {
    name: 'Conditionals',
    instruction: 'Las condiciones te permiten ejecutar código solo si algo es verdadero. Ejemplo: if (x > 0) { ... }',
    blocks: [
      { id: 1, text: 'if' },
      { id: 2, text: '(' },
      { id: 3, text: 'x' },
      { id: 4, text: '>' },
      { id: 5, text: '0' },
      { id: 6, text: ')' },
      { id: 7, text: '{' },
      { id: 8, text: '}' },
    ],
    correctOrder: [1,2,3,4,5,6,7,8],
    prompt: 'Arma una declaración de if:',
    step: 'Paso 4: ¿Qué es una condicional?',
    example: 'if (x > 0) { /* ... */ } // Ejecuta código si x es positivo',
  },
  {
    name: 'Functions',
    instruction: 'Una función agrupa código para ejecutar más tarde. Ejemplo: function greet() { ... }',
    blocks: [
      { id: 1, text: 'function' },
      { id: 2, text: 'greet' },
      { id: 3, text: '(' },
      { id: 4, text: ')' },
      { id: 5, text: '{' },
      { id: 6, text: '}' },
    ],
    correctOrder: [1,2,3,4,5,6],
    prompt: 'Arma una declaración de función:',
    step: 'Paso 5: ¿Qué es una función?',
    example: 'function greet() { /* ... */ } // Una función llamada greet',
  },
  {
    name: 'Objects',
    instruction: 'Un objeto agrupa valores relacionados. Ejemplo: const obj = { a: 1 }',
    blocks: [
      { id: 1, text: 'const' },
      { id: 2, text: 'obj' },
      { id: 3, text: '=' },
      { id: 4, text: '{' },
      { id: 5, text: 'a' },
      { id: 6, text: ':' },
      { id: 7, text: '1' },
      { id: 8, text: '}' },
      { id: 9, text: ';' },
    ],
    correctOrder: [1,2,3,4,5,6,7,8,9],
    prompt: 'Arma un objeto declaration:',
    step: 'Paso 6: ¿Qué es un objeto?',
    example: 'const obj = { a: 1 }; // Objeto con propiedad a',
  },
  {
    name: 'Final Challenge',
    instruction: 'Combina lo que aprendiste: let nums = [1,2,3]; for (let i = 0; i < nums.length; i++) { if (nums[i] > 1) { ... } }',
    blocks: [
      { id: 1, text: 'let' },
      { id: 2, text: 'nums' },
      { id: 3, text: '=' },
      { id: 4, text: '[' },
      { id: 5, text: '1' },
      { id: 6, text: ',' },
      { id: 7, text: '2' },
      { id: 8, text: ',' },
      { id: 9, text: '3' },
      { id: 10, text: ']' },
      { id: 11, text: ';' },
      { id: 12, text: 'for' },
      { id: 13, text: '(' },
      { id: 14, text: 'let' },
      { id: 15, text: 'i' },
      { id: 16, text: '=' },
      { id: 17, text: '0' },
      { id: 18, text: ';' },
      { id: 19, text: 'i' },
      { id: 20, text: '<' },
      { id: 21, text: 'nums.length' },
      { id: 22, text: ';' },
      { id: 23, text: 'i++' },
      { id: 24, text: ')' },
      { id: 25, text: '{' },
      { id: 26, text: 'if' },
      { id: 27, text: '(' },
      { id: 28, text: 'nums[i]' },
      { id: 29, text: '>' },
      { id: 30, text: '1' },
      { id: 31, text: ')' },
      { id: 32, text: '{' },
      { id: 33, text: '...' },
      { id: 34, text: '}' },
      { id: 35, text: '}' },
      { id: 36, text: '}' },
    ],
    correctOrder: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36],
    prompt: 'Final Challenge: Assemble the full code!',
    step: 'Final Challenge: Combine all concepts',
    example: 'let nums = [1,2,3]; for (let i = 0; i < nums.length; i++) { if (nums[i] > 1) { /* ... */ } } // Loop and check values',
  },
];

// Add translations for UI labels
const TRANSLATIONS = {
  en: {
    practiceMode: 'Practice Mode',
    next: 'Next',
    previous: 'Previous',
    check: 'Check Answer',
    hint: 'Hint',
    reveal: 'Reveal Solution',
    badges: 'Badges',
    analytics: 'Analytics Dashboard',
    modulesCompleted: 'Modules Completed',
    avgTime: 'Average Time',
    fastestTime: 'Fastest Time',
    badgesEarned: 'Badges Earned',
    customBuilder: 'Custom Challenge Builder',
    startCustom: 'Start Custom Challenge',
    retry: 'Retry',
    timeLeft: 'Time Left',
    noBadges: 'No badges yet',
  },
  es: {
    practiceMode: 'Modo de práctica',
    next: 'Siguiente',
    previous: 'Anterior',
    check: 'Verificar respuesta',
    hint: 'Pista',
    reveal: 'Revelar solución',
    badges: 'Insignias',
    analytics: 'Panel de análisis',
    modulesCompleted: 'Módulos completados',
    avgTime: 'Tiempo promedio',
    fastestTime: 'Tiempo más rápido',
    badgesEarned: 'Insignias obtenidas',
    customBuilder: 'Creador de desafíos personalizados',
    startCustom: 'Iniciar desafío personalizado',
    retry: 'Reintentar',
    timeLeft: 'Tiempo restante',
    noBadges: 'Aún sin insignias',
  }
};
const t = TRANSLATIONS[language];

function App() {
  // Language state
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('ic-language') || 'en';
  });

  // Select modules based on language
  const MODULES = language === 'es' ? MODULES_ES : MODULES_EN;

  // Move moduleIdx declaration above all useEffects that use it
  const [moduleIdx, setModuleIdx] = useState(() => {
    const saved = localStorage.getItem('ic-moduleIdx');
    return saved ? Number(saved) : 0;
  });

  // Progress persistence
  // Timer state
  const [timer, setTimer] = useState(0);
  const [isTiming, setIsTiming] = useState(false);
  const [bestTimes, setBestTimes] = useState(() => {
    const saved = localStorage.getItem('ic-bestTimes');
    return saved ? JSON.parse(saved) : Array(MODULES.length).fill(null);
  });

  // Start timer on module load
  useEffect(() => {
    setTimer(0);
    setIsTiming(true);
  }, [moduleIdx]);

  // Timer interval
  useEffect(() => {
    if (!isTiming) return;
    const interval = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [isTiming]);

  // Save best times
  useEffect(() => {
    localStorage.setItem('ic-bestTimes', JSON.stringify(bestTimes));
  }, [bestTimes]);
  const [completedModules, setCompletedModules] = useState(() => {
    const saved = localStorage.getItem('ic-completedModules');
    return saved ? JSON.parse(saved) : Array(MODULES.length).fill(false);
  });
  const [blocks, setBlocks] = useState(MODULES[0].blocks.map(b => b.id));
  const [feedback, setFeedback] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);
  const [practiceMode, setPracticeMode] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);

  // Restore blocks for saved module
  useEffect(() => {
    setBlocks(MODULES[moduleIdx].blocks.map(b => b.id));
  }, [moduleIdx]);

  // Save progress
  useEffect(() => {
    localStorage.setItem('ic-moduleIdx', String(moduleIdx));
    localStorage.setItem('ic-completedModules', JSON.stringify(completedModules));
  }, [moduleIdx, completedModules]);

  // Persist user progress in local storage
  useEffect(() => {
    localStorage.setItem('ic-completedModules', JSON.stringify(completedModules));
    localStorage.setItem('ic-bestTimes', JSON.stringify(bestTimes));
    localStorage.setItem('ic-moduleIdx', String(moduleIdx));
    localStorage.setItem('ic-language', language);
  }, [completedModules, bestTimes, moduleIdx, language]);

  // Restore progress on language change
  useEffect(() => {
    const savedCompleted = localStorage.getItem('ic-completedModules');
    const savedBestTimes = localStorage.getItem('ic-bestTimes');
    const savedModuleIdx = localStorage.getItem('ic-moduleIdx');
    if (savedCompleted) setCompletedModules(JSON.parse(savedCompleted));
    if (savedBestTimes) setBestTimes(JSON.parse(savedBestTimes));
    if (savedModuleIdx) setModuleIdx(Number(savedModuleIdx));
  }, [language]);

  const currentModule = MODULES[moduleIdx];

  function moveBlock(idx: number, direction: -1 | 1) {
    const newBlocks = [...blocks];
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= newBlocks.length) return;
    [newBlocks[idx], newBlocks[targetIdx]] = [newBlocks[targetIdx], newBlocks[idx]];
    setBlocks(newBlocks);
    setFeedback('');
    setIsCorrect(false);
    setShowHint(false);
    setShowSolution(false);
  }

  function onDragEnd(result: DropResult) {
    if (!result.destination) return;
    const newBlocks = Array.from(blocks);
    const [removed] = newBlocks.splice(result.source.index, 1);
    newBlocks.splice(result.destination.index, 0, removed);
    setBlocks(newBlocks);
    setFeedback('');
    setIsCorrect(false);
    setShowHint(false);
    setShowSolution(false);
  }

  function checkAnswer() {
    if (blocks.join(',') === currentModule.correctOrder.join(',')) {
      setFeedback('✅ Correct! You may proceed to the next module.');
      setIsCorrect(true);
      setShowHint(false);
      setShowSolution(false);
      setFailedAttempts(0);
      setIsTiming(false);
      // Mark module as completed
      setCompletedModules((prev: boolean[]) => {
        const updated = [...prev];
        updated[moduleIdx] = true;
        return updated;
      });
      // Record best time
      setBestTimes((prev: (number|null)[]) => {
        const updated = [...prev];
        if (!updated[moduleIdx] || timer < updated[moduleIdx]) {
          updated[moduleIdx] = timer;
        }
        return updated;
      });
    } else {
      setFeedback('❌ Not quite. Try rearranging the blocks.');
      setIsCorrect(false);
      setFailedAttempts(failedAttempts + 1);
    }
  }

  function goToModule(idx: number) {
    setModuleIdx(idx);
    setBlocks(MODULES[idx].blocks.map(b => b.id));
    setFeedback('');
    setIsCorrect(false);
    setShowHint(false);
    setShowSolution(false);
    setFailedAttempts(0);
  }

  function nextModule() {
    if (moduleIdx < MODULES.length - 1 && isCorrect) {
      goToModule(moduleIdx + 1);
    }
  }

  function prevModule() {
    if (moduleIdx > 0) {
      goToModule(moduleIdx - 1);
    }
  }

  // Achievements and badges state
  const [badges, setBadges] = useState<string[]>(() => {
    const saved = localStorage.getItem('ic-badges');
    return saved ? JSON.parse(saved) : [];
  });

  // Award badges on module completion
  useEffect(() => {
    if (!isCorrect) return;
    let newBadges = [...badges];
    // Perfect score badge
    if (failedAttempts === 0 && !badges.includes('Perfect')) newBadges.push('Perfect');
    // Fast completion badge
    if (timer <= 20 && !badges.includes('Speedster')) newBadges.push('Speedster');
    // Streak badge
    if (completedModules.filter(Boolean).length >= 3 && !badges.includes('Streak')) newBadges.push('Streak');
    if (newBadges.length !== badges.length) {
      setBadges(newBadges);
      localStorage.setItem('ic-badges', JSON.stringify(newBadges));
    }
  }, [isCorrect]);

  return (
    <div className="app-layout">
      {/* Language Selector */}
      <div style={{ position: 'absolute', top: 8, left: 8 }}>
        <label htmlFor="language-select" style={{ fontWeight: 'bold', fontSize: '1em', marginRight: 8 }}>🌐 Language:</label>
        <select
          id="language-select"
          value={language}
          onChange={e => {
            setLanguage(e.target.value);
            localStorage.setItem('ic-language', e.target.value);
          }}
          aria-label="Select language"
          style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #bbb' }}
        >
          {LANGUAGE_OPTIONS.map(opt => (
            <option key={opt.code} value={opt.code}>{opt.label}</option>
          ))}
        </select>
      </div>
      {/* Practice Mode Toggle */}
      <div style={{ position: 'absolute', top: 8, right: 8 }}>
        <label style={{ fontWeight: 'bold', fontSize: '1em' }}>
          <input
            type="checkbox"
            checked={practiceMode}
            onChange={e => setPracticeMode(e.target.checked)}
            aria-checked={practiceMode}
            aria-label="Toggle practice mode"
            style={{ marginRight: 6 }}
          />
          Practice Mode
        </label>
      </div>
      {/* Header / Navigation */}
      <header className="main-header" role="banner" style={{ marginTop: 32 }}>
        <h1>Interactive Coding Practice</h1>
        <nav aria-label="Main navigation">
          <ul className="nav-list">
            {MODULES.map((mod, idx) => (
              <li key={mod.name}>
                <button
                  onClick={() => goToModule(idx)}
                  aria-current={idx === moduleIdx ? 'page' : undefined}
                  disabled={!practiceMode && idx > moduleIdx}
                >
                  {mod.name}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="main-content" role="main">
        {/* Progress Tracker */}
        <section aria-label="Progress Tracker" className="progress-tracker" style={{ marginBottom: 16 }}>
                  {/* Analytics Dashboard */}
                  <section aria-label="Analytics Dashboard" style={{ margin: '16px 0', background: '#f5f5f5', borderRadius: 8, padding: 16, border: '1px solid #e0e0e0', maxWidth: 520 }}>
                    <h3 style={{ margin: '0 0 8px 0' }}>Analytics Dashboard</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <span>Modules Completed: <strong>{completedModules.filter(Boolean).length} / {MODULES.length}</strong></span>
                      <span>Average Time: <strong>{avgTime}s</strong></span>
                      <span>Fastest Time: <strong>{fastestTime}s</strong></span>
                      <span>Badges Earned: <strong>{badges.length}</strong></span>
                    </div>
                  </section>
          <p>Progress: Module {moduleIdx + 1} / {MODULES.length}</p>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', margin: '8px 0' }}>
            <span role="timer" aria-live="polite">Time: {timer}s</span>
            {bestTimes[moduleIdx] != null && (
              <span style={{ color: '#388e3c' }}>Best: {bestTimes[moduleIdx]}s</span>
            )}
            {/* Achievements/Badges */}
            <span style={{ marginLeft: 16, display: 'flex', gap: 8 }}>
              {/* All modules completed badge */}
              {completedModules.every(Boolean) && (
                <span title="All modules completed!" style={{ background: '#ffd700', color: '#333', borderRadius: 8, padding: '2px 8px', fontWeight: 'bold', fontSize: '0.95em', border: '1px solid #e6c200' }}>🏆 All Done!</span>
              )}
              {/* Speed badge for any module under 10s */}
              {bestTimes.some((t: number | null) => t != null && t <= 10) && (
                <span title="Completed a module in 10s or less!" style={{ background: '#b2ff59', color: '#333', borderRadius: 8, padding: '2px 8px', fontWeight: 'bold', fontSize: '0.95em', border: '1px solid #7ecb20' }}>⚡ Fast Learner</span>
              )}
            </span>
          </div>
          <div
            aria-label="Module progress bar"
            role="progressbar"
            aria-valuenow={moduleIdx + 1}
            aria-valuemin={1}
            aria-valuemax={MODULES.length}
            style={{
              width: '100%',
              height: 16,
              background: '#eee',
              borderRadius: 8,
              marginTop: 4,
              marginBottom: 4,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <div
              style={{
                width: `${(completedModules.filter(Boolean).length / MODULES.length) * 100}%`,
                height: '100%',
                background: '#4caf50',
                borderRadius: 8,
                transition: 'width 0.3s',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 4, justifyContent: 'space-between', fontSize: '0.9em' }}>
            {MODULES.map((mod, idx) => (
              <span key={mod.name} style={{ color: completedModules[idx] ? '#4caf50' : idx === moduleIdx ? '#1976d2' : '#888', fontWeight: idx === moduleIdx ? 'bold' : 'normal' }}>{mod.name[0]}</span>
            ))}
          </div>
        </section>

        {/* Module Content */}
        <section aria-label="Module Content" className="module-content">
          <h2>Module: {currentModule.name}
            <button
              aria-label="Read module name aloud"
              style={{ marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer', fontSize: '1em' }}
              onClick={() => speak(`Module: ${currentModule.name}`)}
            >🔊</button>
          </h2>
          <p>
            {currentModule.step}
            <button
              aria-label={language === 'es' ? 'Leer paso en voz alta' : 'Read step aloud'}
              style={{ marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer', fontSize: '1em' }}
              onClick={() => speak(currentModule.step)}
            >🔊</button>
          </p>
          <p>
            {currentModule.instruction}
            <button
              aria-label={language === 'es' ? 'Leer instrucción en voz alta' : 'Read instruction aloud'}
              style={{ marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer', fontSize: '1em' }}
              onClick={() => speak(currentModule.instruction)}
            >🔊</button>
          </p>
          <div style={{ marginTop: 8, background: '#f3f7fa', borderRadius: 6, padding: 8, fontSize: '0.98em' }}>
            <strong>Real-World Example:</strong>
            <pre style={{ margin: 0, fontFamily: 'monospace', background: 'none' }}>{currentModule.example}</pre>
          </div>
        </section>

        {/* Code Block Assembly Component */}
        <section aria-label="Code Block Assembly" className="code-block-assembly">
          <h3>
            {currentModule.prompt}
            <button
              aria-label={language === 'es' ? 'Leer en voz alta' : 'Read prompt aloud'}
              style={{ marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer', fontSize: '1em' }}
              onClick={() => speak(currentModule.prompt)}
            >🔊</button>
          </h3>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="code-blocks" direction="horizontal">
              {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
                <div
                  className="block-row"
                  style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', minHeight: 48, background: snapshot.isDraggingOver ? '#e3f2fd' : undefined }}
                  role="list"
                  aria-label="Code blocks to assemble"
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  {blocks.map((blockId, idx) => {
                    const block = currentModule.blocks.find(b => b.id === blockId)!;
                    return (
                      <Draggable key={block.id} draggableId={String(block.id)} index={idx}>
                        {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                          <span
                            className="code-block"
                            style={{
                              border: '1px solid #ccc',
                              borderRadius: 4,
                              padding: '6px 12px',
                              background: snapshot.isDragging ? '#bbdefb' : '#f9f9f9',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              marginBottom: 4,
                              boxShadow: snapshot.isDragging ? '0 2px 8px #90caf9' : undefined,
                              ...provided.draggableProps.style,
                            }}
                            tabIndex={0}
                            role="listitem"
                            aria-label={`Code block: ${block.text}`}
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <span aria-hidden="true">{block.text}</span>
                            <button
                              aria-label={`Move ${block.text} left`}
                              disabled={idx === 0}
                              onClick={() => moveBlock(idx, -1)}
                              style={{ marginLeft: 4 }}
                            >
                              <span aria-hidden="true">&larr;</span>
                              <span className="visually-hidden">Move left</span>
                            </button>
                            <button
                              aria-label={`Move ${block.text} right`}
                              disabled={idx === blocks.length - 1}
                              onClick={() => moveBlock(idx, 1)}
                            >
                              <span aria-hidden="true">&rarr;</span>
                              <span className="visually-hidden">Move right</span>
                            </button>
                          </span>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={checkAnswer} aria-label="Check if code is correct">Check Answer</button>
            <button onClick={() => setShowHint(true)} aria-label="Show a hint" disabled={showHint || isCorrect}>Hint</button>
            <button onClick={() => setShowSolution(true)} aria-label="Reveal the solution" disabled={showSolution || isCorrect || failedAttempts < 2}>Reveal Solution</button>
          </div>
          <div style={{ fontSize: '0.9em', color: '#555', marginTop: 4 }}>
            <span className="visually-hidden">Tip: </span>
            <span aria-hidden="true">Tip: </span>
            Use Tab/Shift+Tab to focus code blocks, and arrow buttons to rearrange.
          </div>
          {showHint && !isCorrect && (
            <div style={{ marginTop: 8, background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 4, padding: 8, color: '#ad8b00' }}>
              <strong>Hint:</strong> The first block is <code>{currentModule.blocks[0].text}</code>.
            </div>
          )}
          {showSolution && !isCorrect && (
            <div style={{ marginTop: 8, background: '#e6f7ff', border: '1px solid #91d5ff', borderRadius: 4, padding: 8, color: '#0050b3' }}>
              <strong>Solution:</strong> {currentModule.correctOrder.map(id => currentModule.blocks.find(b => b.id === id)!.text).join(' ')}
            </div>
          )}
        </section>
        {/* Feedback Section and Navigation */}
        <section aria-label="Feedback" className="feedback-section">
          {feedback && (
            <div
              role="status"
              aria-live="polite"
              style={{
                marginTop: 12,
                color: isCorrect ? 'green' : 'crimson',
                fontWeight: 'bold',
              }}
            >
              {feedback}
            </div>
          )}
          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <button onClick={prevModule} disabled={moduleIdx === 0}>Previous</button>
            <button
              onClick={nextModule}
              disabled={moduleIdx === MODULES.length - 1 || (!isCorrect && !practiceMode)}
            >
              Next
            </button>
          </div>
        </section>
        {/* Timed Challenge UI */}
        <div style={{ marginTop: 8, fontWeight: 'bold', color: timeLeft <= 10 ? 'crimson' : '#1976d2' }}>
          Time Left: {timeLeft}s
          {timedOut && (
            <button onClick={() => { setTimeLeft(challengeTime); setTimedOut(false); setIsTiming(true); setFeedback(''); setIsCorrect(false); setBlocks(MODULES[moduleIdx].blocks.map(b => b.id)); }} style={{ marginLeft: 12 }}>
              Retry
            </button>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="main-footer" role="contentinfo">
        <p>&copy; 2026 Interactive Coding. All rights reserved.</p>
      </footer>
      {/* Custom Challenge Builder */}
      <section aria-label="Custom Challenge Builder" className="custom-challenge-builder" style={{ margin: '24px 0', background: '#f5f5f5', borderRadius: 8, padding: 16, border: '1px solid #e0e0e0', maxWidth: 520 }}>
        <h3 style={{ fontSize: '1.1em', margin: '0 0 8px 0' }}>Custom Challenge Builder</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
          <input
            type="text"
            placeholder="Enter your challenge prompt (e.g. Assemble a for loop)"
            value={customPrompt}
            onChange={e => setCustomPrompt(e.target.value)}
            style={{ padding: 6, borderRadius: 4, border: '1px solid #bbb' }}
            aria-label="Custom challenge prompt"
          />
          <input
            type="text"
            placeholder="Enter code blocks separated by spaces (e.g. for ( let i = 0 ; i < 3 ; i++ ) { })"
            value={customBlocksInput}
            onChange={e => setCustomBlocksInput(e.target.value)}
            style={{ padding: 6, borderRadius: 4, border: '1px solid #bbb' }}
            aria-label="Custom code blocks"
          />
          <button onClick={startCustomChallenge} style={{ width: 'fit-content' }}>Start Custom Challenge</button>
        </div>
        {customActive && (
          <div style={{ marginTop: 12 }}>
            <h4 style={{ margin: '0 0 8px 0' }}>{customPrompt}</h4>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              {customOrder.map((blockId, idx) => {
                const block = customBlocks.find(b => b.id === blockId);
                if (!block) return null;
                return (
                  <span
                    key={block.id}
                    className="code-block"
                    style={{ border: '1px solid #ccc', borderRadius: 4, padding: '6px 12px', background: '#f9f9f9', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 4 }}
                    tabIndex={0}
                    role="listitem"
                    aria-label={`Code block: ${block.text}`}
                  >
                    <span aria-hidden="true">{block.text}</span>
                    <button aria-label={`Move ${block.text} left`} disabled={idx === 0} onClick={() => moveCustomBlock(idx, -1)} style={{ marginLeft: 4 }}>&larr;</button>
                    <button aria-label={`Move ${block.text} right`} disabled={idx === customOrder.length - 1} onClick={() => moveCustomBlock(idx, 1)}>&rarr;</button>
                  </span>
                );
              })}
            </div>
            <button onClick={checkCustomAnswer} style={{ marginTop: 8 }}>Check Answer</button>
            {customFeedback && <div role="status" aria-live="polite" style={{ marginTop: 12, color: customSolved ? 'green' : 'crimson', fontWeight: 'bold' }}>{customFeedback}</div>}
          </div>
        )}
      </section>
    </div>
  )
}

export default App
