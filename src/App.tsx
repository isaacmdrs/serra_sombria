import { useState, useEffect, useRef } from 'react';
import type { ReactNode, CSSProperties, ChangeEvent, FormEvent } from 'react';

// --- ESTILOS GLOBAIS SOFISTICADOS ---
const globalCss = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  
  body { 
    margin: 0; 
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif; 
    background-color: #f8fafc; 
    color: #0f172a; 
    -webkit-font-smoothing: antialiased; 
  }

  /* Scrollbar Fina e Elegante */
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
  ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
  
  /* Animações Suaves */
  @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
  
  /* Efeitos de Hover nos Cards */
  .card-hover { 
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); 
    will-change: transform, box-shadow;
  }
  .card-hover:hover { 
    transform: translateY(-8px); 
    box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.1), 0 0 20px -10px rgba(0, 0, 0, 0.05); 
  }
  
  /* Botões Premium */
  .btn-primary { 
    background: #0f172a; 
    color: white;
    box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.1), 0 2px 4px -1px rgba(15, 23, 42, 0.06);
    transition: all 0.2s ease; 
  }
  .btn-primary:hover { 
    background: #1e293b; 
    transform: translateY(-2px); 
    box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.2); 
  }
  .btn-primary:active { transform: translateY(0); }
  
  /* Inputs Modernos (Estilo Notion/Apple) */
  .input-focus { 
    border: 1px solid transparent; 
    background-color: #f1f5f9; 
    transition: all 0.2s ease;
  }
  .input-focus:focus { 
    outline: none; 
    background-color: #ffffff; 
    border-color: #cbd5e1; 
    box-shadow: 0 0 0 4px rgba(226, 232, 240, 0.6); 
  }

  /* Abas Modernas */
  .tab-btn { 
    position: relative; 
    padding: 10px 24px; 
    font-weight: 600; 
    font-size: 14px; 
    color: #64748b; 
    background: transparent; 
    border: none; 
    cursor: pointer; 
    transition: all 0.3s ease; 
    border-radius: 99px;
  }
  .tab-btn:hover { color: #0f172a; background-color: rgba(15, 23, 42, 0.03); }
  .tab-btn.active { color: #fff; background-color: #0f172a; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15); }

  /* Checkbox & Tags */
  .tag-checkbox-container { 
    display: flex; flex-wrap: wrap; gap: 8px; padding: 16px; 
    background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; 
    max-height: 180px; overflow-y: auto; 
  }
  .tag-item { 
    display: flex; align-items: center; gap: 8px; padding: 8px 16px; 
    background: white; border: 1px solid #e2e8f0; border-radius: 99px; 
    cursor: pointer; font-size: 13px; font-weight: 500; color: #475569;
    transition: all 0.2s; user-select: none; 
  }
  .tag-item:hover { border-color: #cbd5e1; transform: translateY(-1px); }
  .tag-item.selected { 
    background: #0f172a; border-color: #0f172a; color: white; 
    box-shadow: 0 4px 10px rgba(15, 23, 42, 0.2);
  }
  .tag-item input { display: none; }
`;

// --- 1. Tipos ---
interface Entity {
  [key: string]: any; 
  Nome: string;
  Descricao?: string; 
  UltimaAtualizacao: string;
}

// --- 2. Configuração da API ---
const N8N_BASE_URL_PRODUCTION = import.meta.env.VITE_N8N_URL || ''; 
const API_TOKEN = import.meta.env.VITE_API_TOKEN || '';

const HEADER_NAME = 'api-key';

type EntityType = 'locais' | 'personagens' | 'tags';

const ENTITY_CONFIG: Record<EntityType, {
  label: string;
  idKey: string;
  listEndpoint: string;
  saveTextEndpoint: string;
  saveImageEndpoint: string;
  fetchImageEndpoint: string;
  imgQueryParam: string;
  placeholderIcon: string;
}> = {
  locais: {
    label: 'Locais',
    idKey: 'idLocal',
    listEndpoint: `${N8N_BASE_URL_PRODUCTION}/listar-todas-localidades`,
    saveTextEndpoint: `${N8N_BASE_URL_PRODUCTION}/salvar-local`,
    saveImageEndpoint: `${N8N_BASE_URL_PRODUCTION}/salvar-imagem-local`,
    fetchImageEndpoint: `${N8N_BASE_URL_PRODUCTION}/buscar-imagem-id`,
    imgQueryParam: 'idLocal',
    placeholderIcon: '🏰'
  },
  personagens: {
    label: 'Personagens',
    idKey: 'ID',
    listEndpoint: `${N8N_BASE_URL_PRODUCTION}/listar-todos-personagens`,
    saveTextEndpoint: `${N8N_BASE_URL_PRODUCTION}/salvar-personagem`,
    saveImageEndpoint: `${N8N_BASE_URL_PRODUCTION}/salvar-imagem-personagem`,
    fetchImageEndpoint: `${N8N_BASE_URL_PRODUCTION}/buscar-imagem-id`,
    imgQueryParam: 'idPersonagem',
    placeholderIcon: '👤'
  },
  tags: {
    label: 'Tags',
    idKey: 'idTag',
    listEndpoint: `${N8N_BASE_URL_PRODUCTION}/listar-todas-tags`,
    saveTextEndpoint: `${N8N_BASE_URL_PRODUCTION}/salvar-tag`,
    saveImageEndpoint: `${N8N_BASE_URL_PRODUCTION}/salvar-imagem-tag`,
    fetchImageEndpoint: `${N8N_BASE_URL_PRODUCTION}/buscar-imagem-id`,
    imgQueryParam: 'idTag',
    placeholderIcon: '🏷️'
  }
};

const stringToColor = (str: any) => {
  if (!str || typeof str !== 'string') return `hsl(200, 20%, 90%)`; 
  let hash = 0;
  for (let i = 0; i < str.length; i++) { hash = str.charCodeAt(i) + ((hash << 5) - hash); }
  const h = hash % 360;
  return `hsl(${h}, 60%, 88%)`; 
};

// --- COMPONENTE: SecureImage ---
interface SecureImageProps {
  entityId: string;
  imgQueryParam: string;
  fetchEndpoint: string;
  alt: string;
  children?: ReactNode;
  style?: CSSProperties;
  updatedAt?: string;
  cachedData?: string | null;
  onImageLoaded?: (id: string, base64: string) => void;
}

const SecureImage = ({ entityId, imgQueryParam, fetchEndpoint, children, style, updatedAt, cachedData, onImageLoaded }: SecureImageProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(cachedData || null);
  const [loading, setLoading] = useState(!cachedData);

  useEffect(() => {
    if (cachedData) {
        setImageUrl(cachedData);
        setLoading(false);
        return;
    }
    if (!entityId || entityId.startsWith('temp-')) {
        setLoading(false);
        return;
    }

    const controller = new AbortController();
    const signal = controller.signal;
    let isMounted = true;
    
    const fetchImage = async () => {
      setLoading(true);
      try {
        const url = new URL(fetchEndpoint);
        url.searchParams.append(imgQueryParam, entityId);

        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: { [HEADER_NAME]: API_TOKEN },
          signal: signal
        });

        if (response.ok) {
          const jsonData = await response.json();
          const rawBase64 = jsonData.data || jsonData.image || jsonData.base64 || Object.values(jsonData)[0];

          if (rawBase64 && isMounted) {
            const stringBase64 = rawBase64.toString();
            const finalSrc = stringBase64.startsWith('data:') ? stringBase64 : `data:image/jpeg;base64,${stringBase64}`;
            setImageUrl(finalSrc);
            if (onImageLoaded) onImageLoaded(entityId, finalSrc);
          }
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') console.error("Erro imagem:", error);
      } finally {
        if (isMounted && !signal.aborted) setLoading(false);
      }
    };

    fetchImage();
    return () => { isMounted = false; controller.abort(); };
  }, [entityId, imgQueryParam, fetchEndpoint, updatedAt, cachedData, onImageLoaded]);

  return (
    <div style={{...style, backgroundColor: stringToColor(entityId), position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundSize: 'cover', backgroundPosition: 'center', backgroundImage: (imageUrl && !loading) ? `url(${imageUrl})` : 'none', transition: 'background-image 0.6s ease-in-out'}}>
      {loading && <div style={{ zIndex: 1, display: 'flex', alignItems: 'center', gap: '8px', animation: 'pulse 1.5s infinite' }}><span style={styles.loadingBadge}>✨ Carregando...</span></div>}
      {!loading && !imageUrl && <span style={{ fontSize: '80px', fontWeight: '900', color: 'rgba(0,0,0,0.05)', letterSpacing: '-4px', userSelect: 'none', zIndex: 1 }}>{entityId && !entityId.startsWith('temp') ? entityId : '?'}</span>}
      <div style={{ zIndex: 10, width: '100%', height: '100%' }}>{children}</div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL: App ---
function App() {
  const [activeTab, setActiveTab] = useState<EntityType>('locais');
  const [items, setItems] = useState<Entity[]>([]);
  const [imageCache, setImageCache] = useState<Record<string, string>>({});
  
  // DADOS AUXILIARES (Separados e Seguros)
  const [auxLocais, setAuxLocais] = useState<Entity[]>([]);
  const [auxTags, setAuxTags] = useState<Entity[]>([]);
  
  const [carregando, setCarregando] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [modo, setModo] = useState<'detalhes' | 'criar' | 'editarTexto' | 'editarImagem'>('detalhes');
  const [salvando, setSalvando] = useState(false);
  const [itemSelecionado, setItemSelecionado] = useState<Entity | null>(null);
  
  const [form, setForm] = useState({ 
    id: '', nome: '', descricao: '', 
    funcao: '', localPrincipal: '', resumo: '', historia: '', tags: [] as string[]
  });

  const [arquivo, setArquivo] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const config = ENTITY_CONFIG[activeTab];

  const handleUpdateCache = (id: string, base64: string) => {
    setImageCache(prev => ({ ...prev, [id]: base64 }));
  };

  // --- 1. EFEITO DE CARGA PRINCIPAL (Lista da Aba) ---
  useEffect(() => {
    const carregarDadosAba = async () => {
      setCarregando(true);
      setItems([]); 
      try {
        const response = await fetch(config.listEndpoint, { headers: { [HEADER_NAME]: API_TOKEN } });
        const data = await response.json();
        setItems(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Erro lista principal:", error);
      } finally {
        setCarregando(false);
      }
    };
    carregarDadosAba();
  }, [activeTab, config.listEndpoint]); 

  // --- 2. EFEITO DE CARGA AUXILIAR (Só roda na aba Personagens) ---
  useEffect(() => {
    const carregarAuxiliares = async () => {
      if (activeTab === 'personagens') {
        console.log("Iniciando carga de Locais e Tags auxiliares...");
        
        // Busca Locais
        fetch(ENTITY_CONFIG.locais.listEndpoint, { headers: { [HEADER_NAME]: API_TOKEN } })
          .then(res => res.json())
          .then(data => {
             console.log("Locais carregados:", data);
             setAuxLocais(Array.isArray(data) ? data : []);
          })
          .catch(err => console.error("Erro ao carregar locais:", err));

        // Busca Tags
        fetch(ENTITY_CONFIG.tags.listEndpoint, { headers: { [HEADER_NAME]: API_TOKEN } })
          .then(res => res.json())
          .then(data => {
             console.log("Tags carregadas:", data);
             setAuxTags(Array.isArray(data) ? data : []);
          })
          .catch(err => console.error("Erro ao carregar tags:", err));
      }
    };
    carregarAuxiliares();
  }, [activeTab]); // Roda sempre que entra na aba Personagens

  // --- HANDLERS ---

  const handleVerDetalhes = (item: Entity) => {
    setItemSelecionado(item);
    setModo('detalhes');
    setModalAberto(true);
  };

  const handleCriar = () => {
    setModo('criar');
    setForm({ 
      id: '', nome: '', descricao: '', 
      funcao: '', localPrincipal: '', resumo: '', historia: '', tags: [] 
    });
    setModalAberto(true);
  };

  const handleEditarTexto = () => {
    if (!itemSelecionado) return;
    setModo('editarTexto');
    
    // Tratamento de tags
    let tagsArray: string[] = [];
    try {
        const rawTags = itemSelecionado.Tags; 
        if (typeof rawTags === 'string') {
            tagsArray = JSON.parse(rawTags);
        } else if (Array.isArray(rawTags)) {
            tagsArray = rawTags;
        }
    } catch(e) {
        console.warn("Erro parse tags:", e);
    }

    setForm({
      id: itemSelecionado[config.idKey],
      nome: itemSelecionado.Nome,
      descricao: itemSelecionado.Descricao || '',
      funcao: itemSelecionado.Funcao || '',
      localPrincipal: itemSelecionado.LocalPrincipal || '',
      resumo: itemSelecionado.Resumo || '',
      historia: itemSelecionado.Historia || '',
      tags: tagsArray
    });
  };

  const handleEditarImagemClick = () => {
    if (!itemSelecionado) return;
    setModo('editarImagem');
    setArquivo(null); 
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const fecharModal = () => {
    setModalAberto(false);
    setItemSelecionado(null);
    setArquivo(null);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setArquivo(e.target.files[0]);
  };

  const toggleTag = (tagName: string) => {
    setForm(prev => {
      const exists = prev.tags.includes(tagName);
      if (exists) return { ...prev, tags: prev.tags.filter(t => t !== tagName) };
      return { ...prev, tags: [...prev.tags, tagName] };
    });
  };

  const handleSalvar = async (e: FormEvent) => {
    e.preventDefault();
    if (modo === 'editarImagem' && !arquivo) { alert("Selecione uma imagem."); return; }

    setSalvando(true);
    try {
      const formData = new FormData();
      let idAtual = '';
      if (modo === 'editarImagem') {
          idAtual = itemSelecionado?.[config.idKey] || '';
      } else {
          idAtual = itemSelecionado ? itemSelecionado[config.idKey] : '';
      }
      
      formData.append(config.imgQueryParam, idAtual); 
      formData.append('id', idAtual); // Fallback

      let urlEndpoint = '';
      if (modo === 'editarImagem') {
          urlEndpoint = config.saveImageEndpoint;
          if (arquivo) formData.append('arquivoImagem', arquivo);
      } else {
          urlEndpoint = config.saveTextEndpoint;
          formData.append('modo', modo === 'criar' ? 'criar' : 'atualizar');
          formData.append('nome', form.nome);

          if (activeTab === 'personagens') {
             formData.append('funcao', form.funcao);
             formData.append('localPrincipal', form.localPrincipal);
             formData.append('resumo', form.resumo);
             formData.append('historia', form.historia);
             formData.append('tags', JSON.stringify(form.tags));
          } else {
             formData.append('descricao', form.descricao);
          }
      }

      const response = await fetch(urlEndpoint, {
        method: 'POST',
        headers: { [HEADER_NAME]: API_TOKEN },
        body: formData
      });

      if (response.ok) {
        if (modo === 'editarImagem' && idAtual) {
            setImageCache(prev => { const n = { ...prev }; delete n[idAtual]; return n; });
            setModo('detalhes');
        } else {
            setModalAberto(false);
        }
        
        // Recarrega lista principal
        const reloadResponse = await fetch(config.listEndpoint, { headers: { [HEADER_NAME]: API_TOKEN } });
        const reloadData = await reloadResponse.json();
        setItems(Array.isArray(reloadData) ? reloadData : []);
      } else {
        const txt = await response.text();
        alert('Erro: ' + txt);
      }
    } catch (error) {
      console.error(error);
      alert('Erro de conexão');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <>
      <style>{globalCss}</style>
      <div style={styles.pageWrapper}>
        <div style={styles.backgroundDecor}></div>
        <div style={styles.container}>
          
          <header style={styles.header}>
            <div>
              <h1 style={styles.title}>Serra Sombria</h1>
              <p style={styles.subtitle}>Gestão de Universo de Serra Sombria</p>
            </div>
            <button onClick={handleCriar} className="btn-primary" style={styles.btnAdd}>
              + Novo {config.label.slice(0, -1)}
            </button>
          </header>

          <div style={styles.tabsContainer}>
            {(Object.keys(ENTITY_CONFIG) as EntityType[]).map((tabKey) => (
              <button
                key={tabKey}
                className={`tab-btn ${activeTab === tabKey ? 'active' : ''}`}
                onClick={() => { setActiveTab(tabKey); setItemSelecionado(null); }}
              >
                {ENTITY_CONFIG[tabKey].placeholderIcon} {ENTITY_CONFIG[tabKey].label}
              </button>
            ))}
          </div>

          <main style={styles.grid}>
            {carregando ? (
              <div style={styles.loadingState}>Sincronizando {config.label.toLowerCase()}...</div>
            ) : items.map((item, index) => {
              const rawId = item[config.idKey];
              const id = rawId ? String(rawId) : `temp-id-${index}`;
              const imgCacheada = imageCache[id];
              
              let subtexto = item.Descricao;
              if (activeTab === 'personagens') {
                  subtexto = item.Funcao || item.Resumo || '...';
              }

              return (
                <div key={id} className="card-hover" style={styles.card} onClick={() => handleVerDetalhes(item)}>
                  <div style={{height: '160px', backgroundColor: stringToColor(id), display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', backgroundImage: imgCacheada ? `url(${imgCacheada})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', transition: 'background-image 0.5s ease-out'}}>
                     {!imgCacheada && <span style={{ fontSize: '60px', fontWeight: '900', color: 'rgba(255,255,255,0.5)', letterSpacing: '-2px' }}>{rawId ? id : '?'}</span>}
                     <div style={styles.cardGradientOverlay}></div>
                  </div>
                  <div style={styles.cardContent}>
                    <h3 style={styles.cardTitle}>{item.Nome || 'Sem Nome'}</h3>
                    <p style={styles.cardDescShort}>{subtexto}</p>
                  </div>
                </div>
              );
            })}
          </main>
        </div>

        {modalAberto && (
          <div style={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) fecharModal() }}>
            <div style={styles.modal}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>{modo === 'detalhes' ? `Detalhes - ${config.label}` : 'Gerenciar Item'}</h2>
                <button onClick={fecharModal} style={styles.btnCloseX}>&times;</button>
              </div>

              {modo === 'detalhes' && itemSelecionado && (
                <div style={styles.detailsContainer}>
                  <SecureImage entityId={itemSelecionado[config.idKey] || 'unknown'} imgQueryParam={config.imgQueryParam} fetchEndpoint={config.fetchImageEndpoint} alt={itemSelecionado.Nome} updatedAt={itemSelecionado.UltimaAtualizacao} cachedData={imageCache[itemSelecionado[config.idKey]]} onImageLoaded={handleUpdateCache} style={styles.bigImage}>
                     <button onClick={handleEditarImagemClick} style={styles.btnEditImageOverlay}>📷 Alterar Capa</button>
                  </SecureImage>
                  <div style={styles.contentBody}>
                    <h3 style={styles.detailsTitle}>{itemSelecionado.Nome}</h3>
                    {activeTab === 'personagens' ? (
                        <>
                            <p style={{fontStyle:'italic', color:'#64748b', marginBottom:'20px'}}>{itemSelecionado.Funcao} | {itemSelecionado.LocalPrincipal}</p>
                            <div style={styles.detailsTextScroll}>
                                <strong>Resumo:</strong> {itemSelecionado.Resumo}<br/><br/>
                                <strong>História:</strong> {itemSelecionado.Historia}
                            </div>
                            <div style={{marginTop: '20px', display: 'flex', gap: '8px', flexWrap: 'wrap'}}>
                                {(() => {
                                    try {
                                        const t = typeof itemSelecionado.Tags === 'string' ? JSON.parse(itemSelecionado.Tags) : itemSelecionado.Tags;
                                        return Array.isArray(t) ? t.map((tag: string) => (<span key={tag} style={{background:'#e0f2fe', color:'#0369a1', padding:'4px 8px', borderRadius:'12px', fontSize:'12px'}}>{tag}</span>)) : null;
                                    } catch { return null; }
                                })()}
                            </div>
                        </>
                    ) : (
                        <div style={styles.detailsTextScroll}>{itemSelecionado.Descricao}</div>
                    )}
                  </div>
                  <div style={styles.footerActions}>
                    <button onClick={handleEditarTexto} className="btn-primary" style={styles.btnPrimary}>Editar Texto</button>
                  </div>
                </div>
              )}

              {(modo === 'criar' || modo === 'editarTexto') && (
                <form onSubmit={handleSalvar} style={styles.form}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Nome</label>
                    <input type="text" required className="input-focus" style={styles.input} value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} />
                  </div>

                  {activeTab === 'personagens' ? (
                      <>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Função / Título</label>
                            <input type="text" className="input-focus" style={styles.input} value={form.funcao} onChange={e => setForm({ ...form, funcao: e.target.value })} placeholder="Ex: Guerreiro, Estalajadeiro..." />
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Local Principal</label>
                            <select className="input-focus" style={styles.input} value={form.localPrincipal} onChange={e => setForm({ ...form, localPrincipal: e.target.value })}>
                                <option value="">Selecione um local...</option>
                                {auxLocais.map(loc => (
                                    <option key={loc.idLocal} value={loc.Nome}>{loc.Nome}</option>
                                ))}
                            </select>
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Resumo</label>
                            <textarea rows={3} className="input-focus" style={styles.textarea} value={form.resumo} onChange={e => setForm({ ...form, resumo: e.target.value })} />
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>História Completa</label>
                            <textarea rows={8} className="input-focus" style={styles.textarea} value={form.historia} onChange={e => setForm({ ...form, historia: e.target.value })} />
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Tags</label>
                            <div className="tag-checkbox-container">
                                {auxTags.map(tag => (
                                    <label key={tag.idTag} className={`tag-item ${form.tags.includes(tag.Nome) ? 'selected' : ''}`}>
                                        <input type="checkbox" checked={form.tags.includes(tag.Nome)} onChange={() => toggleTag(tag.Nome)} />
                                        {tag.Nome}
                                    </label>
                                ))}
                            </div>
                        </div>
                      </>
                  ) : (
                      <div style={styles.inputGroup}>
                        <label style={styles.label}>Descrição</label>
                        <textarea required rows={12} className="input-focus" style={styles.textarea} value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} />
                      </div>
                  )}

                  <div style={styles.footerActions}>
                    {modo === 'editarTexto' && <button type="button" onClick={() => setModo('detalhes')} style={styles.btnSecondary}>Voltar</button>}
                    <button type="submit" disabled={salvando} className="btn-primary" style={styles.btnPrimary}>{salvando ? 'Salvando...' : 'Confirmar'}</button>
                  </div>
                </form>
              )}

              {modo === 'editarImagem' && (
                <form onSubmit={handleSalvar} style={styles.form}>
                  <div style={styles.textAlign('center', '30px')}>
                    <p style={{color: '#64748b', fontSize: '16px'}}>Nova imagem para <strong>{itemSelecionado?.Nome}</strong>.</p>
                  </div>
                  <div style={styles.uploadArea}>
                    <input type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} id="file-upload" style={{display: 'none'}} />
                    <label htmlFor="file-upload" style={styles.uploadLabel}>
                      <span style={{fontSize: '48px', marginBottom: '10px'}}>☁️</span>
                      <span style={{fontWeight: '600', fontSize: '18px', color: '#334155'}}>{arquivo ? arquivo.name : "Clique para selecionar"}</span>
                    </label>
                  </div>
                  <div style={styles.footerActions}>
                    <button type="button" onClick={() => setModo('detalhes')} style={styles.btnSecondary}>Cancelar</button>
                    <button type="submit" disabled={salvando || !arquivo} className="btn-primary" style={styles.btnPrimary}>{salvando ? 'Enviando...' : 'Salvar Imagem'}</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// --- ESTILOS VISUAIS (CSS-IN-JS) ---
const styles: any = {
  // Layout Principal
  pageWrapper: { minHeight: '100vh', position: 'relative', overflowX: 'hidden', paddingBottom: '80px' },
  
  // Background Decorativo (Gradiente suave no topo)
  backgroundDecor: { 
    position: 'fixed', top: 0, left: 0, right: 0, height: '400px', 
    background: 'radial-gradient(circle at 50% -20%, #e2e8f0 0%, rgba(248,250,252,0) 70%)', 
    zIndex: -1, pointerEvents: 'none'
  },
  
  container: { maxWidth: '1100px', margin: '0 auto', padding: '60px 24px' },
  
  // Cabeçalho
  header: { 
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '50px',
    borderBottom: '1px solid rgba(0,0,0,0.03)', paddingBottom: '30px'
  },
  title: { 
    fontSize: '42px', fontWeight: '800', color: '#0f172a', margin: 0, 
    letterSpacing: '-0.04em', lineHeight: '1.1' 
  },
  subtitle: { 
    margin: '8px 0 0 0', color: '#64748b', fontSize: '18px', fontWeight: '400', letterSpacing: '-0.01em' 
  },
  
  // Botão Adicionar (Grande e Chamativo)
  btnAdd: { 
    border: 'none', padding: '14px 28px', borderRadius: '14px', cursor: 'pointer', 
    fontWeight: '600', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' 
  },

  // Container de Abas
  tabsContainer: { 
    display: 'inline-flex', gap: '6px', marginBottom: '50px', 
    backgroundColor: 'white', padding: '6px', borderRadius: '99px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.03), 0 0 0 1px rgba(0,0,0,0.03)' 
  },

  // Grid
  grid: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
    gap: '40px' 
  },
  
  // Cards (Mais limpos)
  card: { 
    backgroundColor: 'white', borderRadius: '24px', overflow: 'hidden', 
    border: '1px solid rgba(255,255,255,0.8)', cursor: 'pointer', 
    display: 'flex', flexDirection: 'column', 
    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.03), 0 4px 6px -2px rgba(0,0,0,0.01)' 
  },
  
  // Overlay gradiente no card para o ID ficar legível
  cardGradientOverlay: { 
    position: 'absolute', inset: 0, 
    background: 'linear-gradient(180deg, rgba(255,255,255,0) 40%, rgba(255,255,255,0.4) 100%)' 
  },
  
  cardContent: { padding: '24px', flexGrow: 1, display: 'flex', flexDirection: 'column' },
  cardTitle: { margin: '0 0 8px 0', fontSize: '20px', fontWeight: '700', color: '#1e293b', letterSpacing: '-0.02em' },
  cardDescShort: { 
    fontSize: '15px', color: '#64748b', lineHeight: '1.6', margin: 0, 
    display: '-webkit-box', WebkitLineClamp: '3', WebkitBoxOrient: 'vertical', overflow: 'hidden' 
  },
  
  // Estado de Carregamento
  loadingState: { gridColumn: '1 / -1', textAlign: 'center', fontSize: '16px', color: '#94a3b8', marginTop: '80px', fontWeight: '500' },

  // Modal (Glassmorphism + Sombra Profunda)
  overlay: { 
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
    backgroundColor: 'rgba(15, 23, 42, 0.3)', backdropFilter: 'blur(12px)', 
    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, 
    animation: 'fadeIn 0.25s ease-out' 
  },
  modal: { 
    backgroundColor: 'white', padding: '0', borderRadius: '24px', 
    width: '90%', maxWidth: '680px', maxHeight: '88vh', overflowY: 'auto', 
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', 
    animation: 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)', 
    display: 'flex', flexDirection: 'column' 
  },
  
  modalHeader: { 
    padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
    borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, 
    backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', zIndex: 20 
  },
  modalTitle: { fontSize: '14px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.5px', margin: 0 },
  btnCloseX: { 
    background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', 
    cursor: 'pointer', color: '#64748b', transition: 'all 0.2s' 
  },

  // Conteúdo Detalhes
  detailsContainer: { padding: '32px', display: 'flex', flexDirection: 'column' },
  bigImage: { 
    width: '100%', height: '320px', borderRadius: '20px', marginBottom: '32px', 
    boxShadow: '0 20px 40px -5px rgba(0,0,0,0.1), inset 0 0 0 1px rgba(255,255,255,0.2)' 
  },
  contentBody: { padding: '0 4px' },
  detailsTitle: { fontSize: '38px', fontWeight: '800', color: '#0f172a', margin: '0 0 20px 0', letterSpacing: '-0.03em', lineHeight: 1.1 },
  separator: { width: '100%', height: '1px', backgroundColor: '#e2e8f0', margin: '24px 0' },
  detailsTextScroll: { fontSize: '17px', lineHeight: '1.7', color: '#475569', whiteSpace: 'pre-wrap' },

  // Botão flutuante na imagem
  btnEditImageOverlay: {
    position: 'absolute', top: '16px', left: '16px',
    backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(8px)',
    border: '1px solid white', color: '#0f172a',
    padding: '8px 16px', borderRadius: '20px', cursor: 'pointer',
    fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)', transition: 'transform 0.2s', zIndex: 20
  },
  
  loadingBadge: { fontSize: '14px', fontWeight: '600', color: '#1e293b', backgroundColor: 'rgba(255,255,255,0.9)', padding: '10px 20px', borderRadius: '30px', backdropFilter: 'blur(8px)', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' },

  // Formulários
  form: { display: 'flex', flexDirection: 'column', gap: '24px', padding: '32px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontWeight: '700', fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px' },
  input: { padding: '14px 18px', borderRadius: '12px', border: '1px solid transparent', backgroundColor: '#f1f5f9', fontSize: '16px', color: '#1e293b', transition: 'all 0.2s' },
  textarea: { padding: '16px 18px', borderRadius: '12px', border: '1px solid transparent', backgroundColor: '#f1f5f9', fontSize: '16px', fontFamily: 'inherit', resize: 'vertical', color: '#1e293b', transition: 'all 0.2s', lineHeight: '1.6' },
  
  uploadArea: { 
    border: '2px dashed #cbd5e1', borderRadius: '20px', padding: '50px 20px', 
    textAlign: 'center', backgroundColor: '#f8fafc', cursor: 'pointer', transition: 'all 0.2s' 
  },
  uploadLabel: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },

  footerActions: { 
    display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px', 
    paddingTop: '24px', borderTop: '1px solid #f1f5f9' 
  },
  btnPrimary: { border: 'none', padding: '14px 32px', borderRadius: '14px', cursor: 'pointer', fontWeight: '600', fontSize: '15px' },
  btnSecondary: { padding: '14px 24px', border: 'none', background: 'transparent', color: '#64748b', cursor: 'pointer', fontWeight: '600', fontSize: '15px', transition: 'color 0.2s' },
  
  textAlign: (align: string, mb: string) => ({ textAlign: align, marginBottom: mb } as CSSProperties)
};

export default App;