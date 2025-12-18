
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

//Vibe coded by diyak8762

import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom/client';

import { Artifact, Session, ComponentVariation, SavedArtifact } from './types';
import { INITIAL_PLACEHOLDERS } from './constants';
import { generateId } from './utils';
import { READY_MADE_TEMPLATES, Template } from './templates';

import DottedGlowBackground from './components/DottedGlowBackground';
import ArtifactCard from './components/ArtifactCard';
import SideDrawer from './components/SideDrawer';
import { 
    ThinkingIcon, 
    CodeIcon, 
    SparklesIcon, 
    ImageIcon,
    DownloadIcon,
    ArrowLeftIcon, 
    ArrowRightIcon, 
    ArrowUpIcon, 
    GridIcon,
    BookmarkIcon,
    LibraryIcon,
    LayoutIcon,
    TrashIcon,
    SunIcon,
    MoonIcon,
    SearchIcon,
    MagicIcon
} from './components/Icons';

// Fix for TypeScript "Cannot find name 'process'"
declare const process: {
  env: {
    API_KEY: string;
    [key: string]: string | undefined;
  };
};

type Theme = 'light' | 'dark';

function App() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionIndex, setCurrentSessionIndex] = useState<number>(-1);
  const [focusedArtifactIndex, setFocusedArtifactIndex] = useState<number | null>(null);
  
  const [inputValue, setInputValue] = useState<string>('');
  const [librarySearchQuery, setLibrarySearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [placeholders, setPlaceholders] = useState<string[]>(INITIAL_PLACEHOLDERS);
  const [theme, setTheme] = useState<Theme>('dark');
  
  const [drawerState, setDrawerState] = useState<{
      isOpen: boolean;
      mode: 'code' | 'variations' | 'library' | 'image' | 'templates' | null;
      title: string;
      data: any; 
  }>({ isOpen: false, mode: null, title: '', data: null });

  const [componentVariations, setComponentVariations] = useState<ComponentVariation[]>([]);
  const [savedArtifacts, setSavedArtifacts] = useState<SavedArtifact[]>([]);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const gridScrollRef = useRef<HTMLDivElement>(null);

  // Initialize Theme and Library
  useEffect(() => {
      const storedTheme = localStorage.getItem('flash_ui_theme') as Theme;
      if (storedTheme) {
          setTheme(storedTheme);
      } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
          setTheme('light');
      }

      const stored = localStorage.getItem('flash_ui_library');
      if (stored) {
          try {
              setSavedArtifacts(JSON.parse(stored));
          } catch (e) {
              console.error("Failed to parse library", e);
          }
      }
      inputRef.current?.focus();
  }, []);

  // Update theme on root element
  useEffect(() => {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('flash_ui_theme', theme);
  }, [theme]);

  // Persist Library
  useEffect(() => {
      localStorage.setItem('flash_ui_library', JSON.stringify(savedArtifacts));
  }, [savedArtifacts]);

  // Fix for mobile: reset scroll when focusing an item to prevent "overscroll" state
  useEffect(() => {
    if (focusedArtifactIndex !== null && window.innerWidth <= 1024) {
        if (gridScrollRef.current) {
            gridScrollRef.current.scrollTop = 0;
        }
        window.scrollTo(0, 0);
    }
  }, [focusedArtifactIndex]);

  // Cycle placeholders
  useEffect(() => {
      const interval = setInterval(() => {
          setPlaceholderIndex(prev => (prev + 1) % placeholders.length);
      }, 3000);
      return () => clearInterval(interval);
  }, [placeholders.length]);

  // Dynamic placeholder generation on load
  useEffect(() => {
      const fetchDynamicPlaceholders = async () => {
          try {
              const apiKey = process.env.API_KEY;
              if (!apiKey) return;
              const ai = new GoogleGenAI({ apiKey });
              const response = await ai.models.generateContent({
                  model: 'gemini-3-flash-preview',
                  contents: { 
                      role: 'user', 
                      parts: [{ 
                          text: 'Generate 20 creative, short, diverse UI component prompts (e.g. "bioluminescent task list"). Return ONLY a raw JSON array of strings. IP SAFEGUARD: Avoid referencing specific famous artists, movies, or brands.' 
                      }] 
                  }
              });
              const text = response.text || '[]';
              const jsonMatch = text.match(/\[[\s\S]*\]/);
              if (jsonMatch) {
                  const newPlaceholders = JSON.parse(jsonMatch[0]);
                  if (Array.isArray(newPlaceholders) && newPlaceholders.length > 0) {
                      const shuffled = newPlaceholders.sort(() => 0.5 - Math.random()).slice(0, 10);
                      setPlaceholders(prev => [...prev, ...shuffled]);
                  }
              }
          } catch (e) {
              console.warn("Silently failed to fetch dynamic placeholders", e);
          }
      };
      setTimeout(fetchDynamicPlaceholders, 1000);
  }, []);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const parseJsonStream = async function* (responseStream: AsyncIterable<GenerateContentResponse>) {
      let buffer = '';
      for await (const chunk of responseStream) {
          const text = chunk.text;
          if (!text) continue;
          buffer += text;
          let braceCount = 0;
          let start = buffer.indexOf('{');
          while (start !== -1) {
              braceCount = 0;
              let end = -1;
              for (let i = start; i < buffer.length; i++) {
                  if (buffer[i] === '{') braceCount++;
                  else if (buffer[i] === '}') braceCount--;
                  if (braceCount === 0 && i > start) {
                      end = i;
                      break;
                  }
              }
              if (end !== -1) {
                  const jsonString = buffer.substring(start, end + 1);
                  try {
                      yield JSON.parse(jsonString);
                      buffer = buffer.substring(end + 1);
                      start = buffer.indexOf('{');
                  } catch (e) {
                      start = buffer.indexOf('{', start + 1);
                  }
              } else {
                  break; 
              }
          }
      }
  };

  const handleGenerateImage = useCallback(async () => {
    const currentSession = sessions[currentSessionIndex];
    if (!currentSession || focusedArtifactIndex === null) return;
    const currentArtifact = currentSession.artifacts[focusedArtifactIndex];

    setIsLoading(true);
    setGeneratedImages([]);
    setDrawerState({ isOpen: true, mode: 'image', title: 'Asset Generation', data: currentArtifact.id });

    try {
        const apiKey = process.env.API_KEY;
        if (!apiKey) throw new Error("API_KEY is not configured.");
        const ai = new GoogleGenAI({ apiKey });

        const imagePrompt = `A high-quality, professional UI asset for a "${currentSession.prompt}". DIRECTION: ${currentArtifact.styleName}. The asset should be an icon, hero illustration, or texture suitable for a modern web interface. Clean composition, appropriate for ${theme} mode. No text. No brand names. Highly detailed.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: imagePrompt }] },
            config: {
                imageConfig: {
                    aspectRatio: "1:1"
                }
            }
        });

        const imageParts = response.candidates?.[0]?.content?.parts || [];
        const newImages: string[] = [];

        for (const part of imageParts) {
            if (part.inlineData) {
                newImages.push(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
            }
        }

        if (newImages.length > 0) {
            setGeneratedImages(newImages);
        }
    } catch (e: any) {
        console.error("Error generating image:", e);
    } finally {
        setIsLoading(false);
    }
  }, [sessions, currentSessionIndex, focusedArtifactIndex, theme]);

  const handleGenerateVariations = useCallback(async () => {
    const currentSession = sessions[currentSessionIndex];
    if (!currentSession || focusedArtifactIndex === null) return;
    const currentArtifact = currentSession.artifacts[focusedArtifactIndex];

    setIsLoading(true);
    setComponentVariations([]);
    setDrawerState({ isOpen: true, mode: 'variations', title: 'Variations', data: currentArtifact.id });

    try {
        const apiKey = process.env.API_KEY;
        if (!apiKey) throw new Error("API_KEY is not configured.");
        const ai = new GoogleGenAI({ apiKey });

        const prompt = `
You are a master UI/UX designer. Generate 3 RADICAL CONCEPTUAL VARIATIONS of: "${currentSession.prompt}".

**STRICT IP SAFEGUARD:**
No names of artists. 
Instead, describe the *Physicality* and *Material Logic* of the UI.

**CREATIVE GUIDANCE (Use these as EXAMPLES of how to describe style, but INVENT YOUR OWN):**
1. Example: "Asymmetrical Primary Grid" (Heavy black strokes, rectilinear structure, flat primary pigments, high-contrast white space).
2. Example: "Suspended Kinetic Mobile" (Delicate wire-thin connections, floating organic primary shapes, slow-motion balance, white-void background).
3. Example: "Grainy Risograph Press" (Overprinted translucent inks, dithered grain textures, monochromatic color depth, raw paper substrate).
4. Example: "Volumetric Spectral Fluid" (Generative morphing gradients, soft-focus diffusion, bioluminescent light sources, spectral chromatic aberration).

**YOUR TASK:**
For EACH variation:
- Invent a unique design persona name based on a NEW physical metaphor.
- Rewrite the prompt to fully adopt that metaphor's visual language.
- Generate high-fidelity HTML/CSS.

Required JSON Output Format (stream ONE object per line):
\`{ "name": "Persona Name", "html": "..." }\`
        `.trim();

        const responseStream = await ai.models.generateContentStream({
            model: 'gemini-3-flash-preview',
             contents: [{ parts: [{ text: prompt }], role: 'user' }],
             config: { temperature: 1.2 }
        });

        for await (const variation of parseJsonStream(responseStream)) {
            if (variation.name && variation.html) {
                setComponentVariations(prev => [...prev, variation]);
            }
        }
    } catch (e: any) {
        console.error("Error generating variations:", e);
    } finally {
        setIsLoading(false);
    }
  }, [sessions, currentSessionIndex, focusedArtifactIndex]);

  const applyVariation = (html: string) => {
      if (focusedArtifactIndex === null) return;
      setSessions(prev => prev.map((sess, i) => 
          i === currentSessionIndex ? {
              ...sess,
              artifacts: sess.artifacts.map((art, j) => 
                j === focusedArtifactIndex ? { ...art, html, status: 'complete' } : art
              )
          } : sess
      ));
      setDrawerState(s => ({ ...s, isOpen: false }));
  };

  const handleShowCode = () => {
      const currentSession = sessions[currentSessionIndex];
      if (currentSession && focusedArtifactIndex !== null) {
          const artifact = currentSession.artifacts[focusedArtifactIndex];
          setDrawerState({ isOpen: true, mode: 'code', title: 'Source Code', data: artifact.html });
      }
  };

  const handleSaveToLibrary = () => {
      const currentSession = sessions[currentSessionIndex];
      if (!currentSession || focusedArtifactIndex === null) return;
      const artifact = currentSession.artifacts[focusedArtifactIndex];
      
      const isAlreadySaved = savedArtifacts.some(a => a.id === artifact.id || (a.html === artifact.html && a.styleName === artifact.styleName));
      if (isAlreadySaved) return;

      const newSaved: SavedArtifact = {
          ...artifact,
          prompt: currentSession.prompt,
          savedAt: Date.now()
      };
      setSavedArtifacts(prev => [newSaved, ...prev]);
  };

  const removeFromLibrary = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setSavedArtifacts(prev => prev.filter(a => a.id !== id));
  };

  const useLibraryItem = (item: SavedArtifact | Template) => {
      const sessionId = generateId();
      const prompt = 'prompt' in item ? item.prompt : `Template: ${item.name}`;
      const styleName = 'styleName' in item ? item.styleName : item.name;

      const newSession: Session = {
          id: sessionId,
          prompt: prompt,
          timestamp: Date.now(),
          artifacts: [{
              id: `${sessionId}_0`,
              styleName: styleName,
              html: item.html,
              status: 'complete'
          }, {
              id: `${sessionId}_1`,
              styleName: 'Variant B',
              html: '',
              status: 'complete'
          }, {
              id: `${sessionId}_2`,
              styleName: 'Variant C',
              html: '',
              status: 'complete'
          }]
      };
      setSessions(prev => [...prev, newSession]);
      setCurrentSessionIndex(sessions.length);
      setFocusedArtifactIndex(0);
      setDrawerState(s => ({ ...s, isOpen: false }));
  };

  const handleShowLibrary = () => {
      setLibrarySearchQuery('');
      setDrawerState({ isOpen: true, mode: 'library', title: 'Collection', data: null });
  };

  const handleShowTemplates = () => {
      setLibrarySearchQuery('');
      setDrawerState({ isOpen: true, mode: 'templates', title: 'Templates', data: null });
  };

  const handleSendMessage = useCallback(async (manualPrompt?: string) => {
    const promptToUse = manualPrompt || inputValue;
    const trimmedInput = promptToUse.trim();
    
    if (!trimmedInput || isLoading) return;
    if (!manualPrompt) setInputValue('');

    setIsLoading(true);
    const baseTime = Date.now();
    const sessionId = generateId();

    const placeholderArtifacts: Artifact[] = Array(3).fill(null).map((_, i) => ({
        id: `${sessionId}_${i}`,
        styleName: 'Designing...',
        html: '',
        status: 'streaming',
    }));

    const newSession: Session = {
        id: sessionId,
        prompt: trimmedInput,
        timestamp: baseTime,
        artifacts: placeholderArtifacts
    };

    setSessions(prev => [...prev, newSession]);
    setCurrentSessionIndex(sessions.length); 
    setFocusedArtifactIndex(null); 

    try {
        const apiKey = process.env.API_KEY;
        if (!apiKey) throw new Error("API_KEY is not configured.");
        const ai = new GoogleGenAI({ apiKey });

        const stylePrompt = `
Generate 3 distinct, highly evocative design directions for: "${trimmedInput}".

**STRICT IP SAFEGUARD:**
Never use artist or brand names. Use physical and material metaphors.

**CREATIVE EXAMPLES (Do not simply copy these, use them as a guide for tone):**
- Example A: "Asymmetrical Rectilinear Blockwork" (Grid-heavy, primary pigments, thick structural strokes, Bauhaus-functionalism vibe).
- Example B: "Tactile Risograph Press" (Tactile paper texture, overprinted translucent inks, dithered gradients).
- Example C: "Kinetic Wireframe Suspension" (Floating silhouettes, thin balancing lines, organic primary shapes).

**GOAL:**
Return ONLY a raw JSON array of 3 *NEW*, creative names for these directions.
        `.trim();

        let generatedStyles: string[] = [];
        try {
            const styleResponse = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: { role: 'user', parts: [{ text: stylePrompt }] }
            });
            const styleText = styleResponse.text || '[]';
            const jsonMatch = styleText.match(/\[[\s\S]*\]/);
            if (jsonMatch) generatedStyles = JSON.parse(jsonMatch[0]);
        } catch (e) {
            console.warn("Style generation failed", e);
        }

        if (!generatedStyles || generatedStyles.length < 3) {
            generatedStyles = ["Primary Grid", "Tactile Press", "Kinetic Balance"];
        }
        
        generatedStyles = generatedStyles.slice(0, 3);

        setSessions(prev => prev.map(s => {
            if (s.id !== sessionId) return s;
            return {
                ...s,
                artifacts: s.artifacts.map((art, i) => ({
                    ...art,
                    styleName: generatedStyles[i]
                }))
            };
        }));

        const generateArtifact = async (artifact: Artifact, styleInstruction: string) => {
            try {
                const prompt = `
Create a stunning UI component for: "${trimmedInput}".
DIRECTION: ${styleInstruction}
Return ONLY RAW HTML. No markdown. No brand names. Support light and dark modes.
                `.trim();
          
                const responseStream = await ai.models.generateContentStream({
                    model: 'gemini-3-flash-preview',
                    contents: [{ parts: [{ text: prompt }], role: "user" }],
                });

                let accumulatedHtml = '';
                for await (const chunk of responseStream) {
                    const text = chunk.text;
                    if (typeof text === 'string') {
                        accumulatedHtml += text;
                        setSessions(prev => prev.map(sess => 
                            sess.id === sessionId ? {
                                ...sess,
                                artifacts: sess.artifacts.map(art => 
                                    art.id === artifact.id ? { ...art, html: accumulatedHtml } : art
                                )
                            } : sess
                        ));
                    }
                }
                
                let finalHtml = accumulatedHtml.trim();
                if (finalHtml.startsWith('```html')) finalHtml = finalHtml.substring(7).trimStart();
                if (finalHtml.startsWith('```')) finalHtml = finalHtml.substring(3).trimStart();
                if (finalHtml.endsWith('```')) finalHtml = finalHtml.substring(0, finalHtml.length - 3).trimEnd();

                setSessions(prev => prev.map(sess => 
                    sess.id === sessionId ? {
                        ...sess,
                        artifacts: sess.artifacts.map(art => 
                            art.id === artifact.id ? { ...art, html: finalHtml, status: 'complete' } : art
                        )
                    } : sess
                ));

            } catch (e: any) {
                console.error('Error generating artifact:', e);
                setSessions(prev => prev.map(sess => 
                    sess.id === sessionId ? {
                        ...sess,
                        artifacts: sess.artifacts.map(art => 
                            art.id === artifact.id ? { ...art, html: `Error: ${e.message}`, status: 'error' } : art
                        )
                    } : sess
                ));
            }
        };

        await Promise.all(placeholderArtifacts.map((art, i) => generateArtifact(art, generatedStyles[i])));

    } catch (e: any) {
        console.error("Fatal error", e);
        setSessions(prev => prev.map(s => s.id === sessionId ? {
            ...s,
            artifacts: s.artifacts.map(art => ({ ...art, status: 'error', html: `Failed: ${e.message}` }))
        } : s));
    } finally {
        setIsLoading(false);
        setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [inputValue, isLoading, sessions.length]);

  const handleSurpriseMe = () => {
      const currentPrompt = placeholders[placeholderIndex];
      setInputValue(currentPrompt);
      handleSendMessage(currentPrompt);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !isLoading) {
      event.preventDefault();
      handleSendMessage();
    } else if (event.key === 'Tab' && !inputValue && !isLoading) {
        event.preventDefault();
        setInputValue(placeholders[placeholderIndex]);
    }
  };

  const nextItem = useCallback(() => {
      if (focusedArtifactIndex !== null) {
          if (focusedArtifactIndex < 2) setFocusedArtifactIndex(focusedArtifactIndex + 1);
      } else {
          if (currentSessionIndex < sessions.length - 1) setCurrentSessionIndex(currentSessionIndex + 1);
      }
  }, [currentSessionIndex, sessions.length, focusedArtifactIndex]);

  const prevItem = useCallback(() => {
      if (focusedArtifactIndex !== null) {
          if (focusedArtifactIndex > 0) setFocusedArtifactIndex(focusedArtifactIndex - 1);
      } else {
           if (currentSessionIndex > 0) setCurrentSessionIndex(currentSessionIndex - 1);
      }
  }, [currentSessionIndex, focusedArtifactIndex]);

  const isLoadingDrawer = isLoading && (drawerState.mode === 'variations' || drawerState.mode === 'image') && (componentVariations.length === 0 && generatedImages.length === 0);

  const hasStarted = sessions.length > 0 || isLoading;
  const currentSession = sessions[currentSessionIndex];

  let canGoBack = false;
  let canGoForward = false;

  if (hasStarted) {
      if (focusedArtifactIndex !== null) {
          canGoBack = focusedArtifactIndex > 0;
          canGoForward = focusedArtifactIndex < (currentSession?.artifacts.length || 0) - 1;
      } else {
          canGoBack = currentSessionIndex > 0;
          canGoForward = currentSessionIndex < sessions.length - 1;
      }
  }

  const isCurrentSaved = focusedArtifactIndex !== null && currentSession && savedArtifacts.some(a => a.html === currentSession.artifacts[focusedArtifactIndex].html);

  const filteredLibrary = useMemo(() => {
    if (!librarySearchQuery) return savedArtifacts;
    const q = librarySearchQuery.toLowerCase();
    return savedArtifacts.filter(item => 
        item.styleName.toLowerCase().includes(q) || 
        item.prompt.toLowerCase().includes(q)
    );
  }, [savedArtifacts, librarySearchQuery]);

  const filteredTemplates = useMemo(() => {
    if (!librarySearchQuery) return READY_MADE_TEMPLATES;
    const q = librarySearchQuery.toLowerCase();
    return READY_MADE_TEMPLATES.filter(item => 
        item.name.toLowerCase().includes(q) || 
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [librarySearchQuery]);

  const wrapWithTheme = (html: string) => {
      const themeCss = theme === 'dark' ? 
        `body { background-color: #000; color: #fff; color-scheme: dark; }` : 
        `body { background-color: #fff; color: #000; color-scheme: light; }`;
      const themeStyle = `<style>:root { transition: background-color 0.3s ease, color 0.3s ease; } ${themeCss}</style>`;
      return themeStyle + html;
  };

  return (
    <>
        <div className={`top-actions ${hasStarted ? 'hide-on-mobile' : ''} ${focusedArtifactIndex !== null ? 'focus-mode-dim' : ''}`}>
             <div className="top-actions-left">
                <button className="theme-toggle-btn" onClick={toggleTheme} title="Toggle Theme">
                    {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
                </button>
                <div className="segmented-control">
                    <button className={`control-btn ${drawerState.mode === 'library' ? 'active' : ''}`} onClick={handleShowLibrary}>
                        <BookmarkIcon /> Saved
                    </button>
                    <button className={`control-btn ${drawerState.mode === 'templates' ? 'active' : ''}`} onClick={handleShowTemplates}>
                        <LayoutIcon /> Templates
                    </button>
                </div>
             </div>
             <a href="https://github.com/DiyaK294" target="_blank" rel="noreferrer" className="creator-credit">
                designed by @diyak8762
            </a>
        </div>

        <SideDrawer isOpen={drawerState.isOpen} onClose={() => setDrawerState(s => ({...s, isOpen: false}))} title={drawerState.title}>
            {(drawerState.mode === 'library' || drawerState.mode === 'templates') && (
                <div className="library-search-container">
                    <SearchIcon />
                    <input 
                        type="text" 
                        placeholder={`Search ${drawerState.mode === 'library' ? 'saved designs' : 'templates'}...`}
                        value={librarySearchQuery}
                        onChange={(e) => setLibrarySearchQuery(e.target.value)}
                    />
                </div>
            )}
            
            {isLoadingDrawer && <div className="loading-state"><ThinkingIcon /> Designing...</div>}
            {drawerState.mode === 'code' && <pre className="code-block"><code>{drawerState.data}</code></pre>}
            
            {drawerState.mode === 'variations' && (
                <div className="sexy-grid">
                    {componentVariations.map((v, i) => (
                         <div key={i} className="sexy-card" onClick={() => applyVariation(v.html)}>
                             <div className="sexy-preview">
                                 <iframe srcDoc={wrapWithTheme(v.html)} title={v.name} sandbox="allow-scripts allow-same-origin" />
                             </div>
                             <div className="sexy-label">{v.name}</div>
                         </div>
                    ))}
                </div>
            )}
            
            {drawerState.mode === 'templates' && (
                <div className="sexy-grid">
                    {filteredTemplates.length === 0 ? <div className="empty-library">No templates match your search.</div> : filteredTemplates.map((item) => (
                        <div key={item.id} className="sexy-card library-card" onClick={() => useLibraryItem(item)}>
                            <div className="sexy-preview">
                                <iframe srcDoc={wrapWithTheme(item.html)} title={item.name} sandbox="allow-scripts allow-same-origin" />
                            </div>
                            <div className="sexy-label">
                                <div className="library-item-meta">
                                    <div className="template-badge">{item.category}</div>
                                    <strong>{item.name}</strong>
                                    <div className="library-item-prompt">{item.description}</div>
                                </div>
                                <div className="template-action-hint"><MagicIcon /></div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {drawerState.mode === 'image' && (
                <div className="sexy-grid">
                    {!isLoading && generatedImages.length === 0 && <div className="empty-library">Failed to generate asset.</div>}
                    {generatedImages.map((img, i) => (
                        <div key={i} className="image-asset-card">
                            <div className="image-preview-container">
                                <img src={img} alt="Generated Asset" />
                                <a href={img} download={`asset_${i}.png`} className="image-download-btn"><DownloadIcon /> Download</a>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            {drawerState.mode === 'library' && (
                <div className="sexy-grid">
                    {filteredLibrary.length === 0 ? (
                        <div className="empty-library">
                            {librarySearchQuery ? "No designs found for your search." : "Empty library. Save a design to see it here."}
                        </div>
                    ) : filteredLibrary.map((item) => (
                        <div key={item.id} className="sexy-card library-card" onClick={() => useLibraryItem(item)}>
                            <div className="sexy-preview">
                                <iframe srcDoc={wrapWithTheme(item.html)} title={item.styleName} sandbox="allow-scripts allow-same-origin" />
                            </div>
                            <div className="sexy-label">
                                <div className="library-item-meta">
                                    <strong>{item.styleName}</strong>
                                    <div className="library-item-prompt">{item.prompt}</div>
                                </div>
                                <button className="delete-btn" onClick={(e) => removeFromLibrary(item.id, e)}><TrashIcon /></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </SideDrawer>

        <div className={`immersive-app ${focusedArtifactIndex !== null ? 'app-focus-blur' : ''}`}>
            <DottedGlowBackground gap={24} radius={1.5} color={theme === 'dark' ? "rgba(255, 255, 255, 0.02)" : "rgba(0, 0, 0, 0.02)"} glowColor={theme === 'dark' ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.1)"} speedScale={0.5} />
            <div className={`stage-container ${focusedArtifactIndex !== null ? 'mode-focus' : 'mode-split'}`}>
                 <div className={`empty-state ${hasStarted ? 'fade-out' : ''}`}>
                     <div className="empty-content">
                         <h1>Flash UI</h1>
                         <p>Creative UI generation in a flash</p>
                         <div className="empty-actions">
                            <button className="surprise-button" onClick={handleSurpriseMe} disabled={isLoading}><SparklesIcon /> Surprise Me</button>
                            <button className="surprise-button ghost" onClick={handleShowTemplates} disabled={isLoading}><LayoutIcon /> Explore Templates</button>
                         </div>
                     </div>
                 </div>
                {sessions.map((session, sIndex) => {
                    let positionClass = sIndex === currentSessionIndex ? 'active-session' : sIndex < currentSessionIndex ? 'past-session' : 'future-session';
                    return (
                        <div key={session.id} className={`session-group ${positionClass}`}>
                            <div className="artifact-grid" ref={sIndex === currentSessionIndex ? gridScrollRef : null}>
                                {session.artifacts.map((artifact, aIndex) => (
                                    <ArtifactCard key={artifact.id} artifact={artifact} isFocused={focusedArtifactIndex === aIndex} theme={theme} onClick={() => setFocusedArtifactIndex(aIndex)} />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
             {canGoBack && <button className="nav-handle left" onClick={prevItem}><ArrowLeftIcon /></button>}
             {canGoForward && <button className="nav-handle right" onClick={nextItem}><ArrowRightIcon /></button>}
            <div className={`action-bar ${focusedArtifactIndex !== null ? 'visible' : ''}`}>
                 <div className="active-prompt-label">{currentSession?.prompt}</div>
                 <div className="action-buttons">
                    <button onClick={() => setFocusedArtifactIndex(null)}><GridIcon /> Grid View</button>
                    <button onClick={handleGenerateVariations} disabled={isLoading}><SparklesIcon /> Variations</button>
                    <button onClick={handleGenerateImage} disabled={isLoading}><ImageIcon /> Asset Gen</button>
                    <button onClick={handleSaveToLibrary} className={isCurrentSaved ? 'saved' : ''}><BookmarkIcon /> {isCurrentSaved ? 'Saved' : 'Save'}</button>
                    <button onClick={handleShowCode}><CodeIcon /> Source</button>
                 </div>
            </div>
            <div className={`floating-input-container ${focusedArtifactIndex !== null ? 'focus-mode-dim' : ''}`}>
                <div className={`input-wrapper ${isLoading ? 'loading' : ''}`}>
                    {(!inputValue && !isLoading) && <div className="animated-placeholder" key={placeholderIndex}><span className="placeholder-text">{placeholders[placeholderIndex]}</span><span className="tab-hint">Tab</span></div>}
                    {!isLoading ? (
                        <input ref={inputRef} type="text" value={inputValue} onChange={handleInputChange} onKeyDown={handleKeyDown} />
                    ) : (
                        <div className="input-generating-label">
                            <span className="generating-prompt-text">{currentSession?.prompt}</span>
                            <ThinkingIcon />
                        </div>
                    )}
                    <button className="send-button" onClick={() => handleSendMessage()} disabled={isLoading || !inputValue.trim()}><ArrowUpIcon /></button>
                </div>
            </div>
        </div>
        {focusedArtifactIndex !== null && <div className="focus-backdrop" onClick={() => setFocusedArtifactIndex(null)} />}
    </>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<React.StrictMode><App /></React.StrictMode>);
}
