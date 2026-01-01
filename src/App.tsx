/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { api } from './api';
import type { Entity, Local, Tag } from './types';

// --- CSS GLOBAL ---
const globalCss = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  body { margin: 0; font-family: 'Plus Jakarta Sans', sans-serif; background-color: #f8fafc; color: #0f172a; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
  .btn-primary { background: #0f172a; color: white; transition: all 0.2s; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
  .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.2); }
  .input-focus:focus { outline: none; border-color: #cbd5e1; box-shadow: 0 0 0 4px rgba(226, 232, 240, 0.6); }
  .card-hover { transition: all 0.4s; }
  .card-hover:hover { transform: translateY(-8px); box-shadow: 0 20px 40px -10px rgba(0,0,0,0.1); }
  
  /* Login Specifics */
  .login-container { height: 100vh; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle at center, #f1f5f9 0%, #cbd5e1 100%); }
  .login-card { background: white; padding: 40px; borderRadius: 24px; width: 100%; maxWidth: 400px; boxShadow: 0 25px 50px -12px rgba(0,0,0,0.25); }
`;

// --- UTILITÁRIOS ---

// CORREÇÃO CRÍTICA: URL estável para arquivos públicos do Google Drive
const getDriveImageUrl = (urlOrId: string | undefined) => {
    if (!urlOrId) return null;
    
    // Se já for um link completo (ex: vindo de outro lugar), retorna ele
    if (urlOrId.startsWith('http')) return urlOrId; 
    
    // URL oficial do Google Drive para exibir imagens públicas
    // "uc" = User Content, "export=view" = Forçar visualização
    return `https://lh3.googleusercontent.com/d/${urlOrId}`;
};

const stringToColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return `hsl(${hash % 360}, 60%, 88%)`;
};

// --- TELA DE LOGIN ---
const LoginScreen = () => {
    const { signIn } = useAuth();
    const [login, setLogin] = useState('');
    const [pass, setPass] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await signIn(login, pass);
        } catch (err) {
            setError('Credenciais inválidas ou erro no servidor.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#0f172a' }}>Serra Sombria</h2>
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>LOGIN</label>
                        <input className="input-focus" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }} 
                            value={login} onChange={e => setLogin(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>SENHA</label>
                        <input type="password" className="input-focus" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }} 
                            value={pass} onChange={e => setPass(e.target.value)} />
                    </div>
                    {error && <p style={{ color: 'red', fontSize: '14px', textAlign: 'center' }}>{error}</p>}
                    <button type="submit" className="btn-primary" style={{ padding: '14px', borderRadius: '12px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }} disabled={loading}>
                        {loading ? 'Entrando...' : 'Acessar Universo'}
                    </button>
                </form>
            </div>
        </div>
    );
};

// --- CONTEÚDO PRINCIPAL ---
function MainContent() {
    const { signOut, user } = useAuth();
    const [activeTab, setActiveTab] = useState<'locais' | 'personagens' | 'tags'>('locais');
    
    // Estados de Dados
    const [items, setItems] = useState<Entity[]>([]);
    const [auxLocais, setAuxLocais] = useState<Local[]>([]);
    const [auxTags, setAuxTags] = useState<Tag[]>([]);
    
    // UI States
    const [carregando, setCarregando] = useState(false);
    const [modalAberto, setModalAberto] = useState(false);
    const [modo, setModo] = useState<'detalhes' | 'criar' | 'editarTexto' | 'editarImagem'>('detalhes');
    const [salvando, setSalvando] = useState(false);
    const [itemSelecionado, setItemSelecionado] = useState<Entity | null>(null);

    // Formulário
    const [form, setForm] = useState({ 
        id: '', nome: '', descricao: '', 
        funcao: '', localPrincipal: '', resumo: '', historia: '', tags: [] as string[]
    });
    const [arquivo, setArquivo] = useState<File | null>(null);

    // Configuração Dinâmica baseada na Aba
    const getConfig = () => {
        switch(activeTab) {
            case 'locais': return { label: 'Locais', idKey: 'idLocal', endpoint: '/locais' };
            case 'personagens': return { label: 'Personagens', idKey: 'id', endpoint: '/personagens' };
            case 'tags': return { label: 'Tags', idKey: 'idTag', endpoint: '/tags' };
        }
    };
    const config = getConfig();

    // --- CARREGAMENTO DE DADOS ---
    const carregarDados = async () => {
        setCarregando(true);
        try {
            const res = await api.get(config.endpoint);
            setItems(res.data);
        } catch (error) {
            console.error("Erro ao carregar:", error);
            if((error as any).response?.status === 403) signOut();
        } finally {
            setCarregando(false);
        }
    };

    const carregarAuxiliares = async () => {
        if (activeTab === 'personagens') {
            try {
                const [resLocais, resTags] = await Promise.all([
                    api.get('/locais'),
                    api.get('/tags')
                ]);
                setAuxLocais(resLocais.data);
                setAuxTags(resTags.data);
            } catch (e) { console.error(e); }
        }
    };

    useEffect(() => {
        carregarDados();
        carregarAuxiliares();
    }, [activeTab]);

    // --- HANDLERS ---
    const getId = (item: any) => item[config.idKey];

    const handleVerDetalhes = (item: Entity) => {
        setItemSelecionado(item);
        setModo('detalhes');
        setModalAberto(true);
    };

    const handleCriar = () => {
        setModo('criar');
        setForm({ id: '', nome: '', descricao: '', funcao: '', localPrincipal: '', resumo: '', historia: '', tags: [] });
        setArquivo(null);
        setModalAberto(true);
    };

    // CORREÇÃO CRÍTICA: Função universal para popular o formulário e evitar perda de dados
    const preencherFormularioComItemSelecionado = () => {
        if (!itemSelecionado) return;
        const item = itemSelecionado as any;
        
        let tagsParsed: string[] = [];
        try {
            if (item.tags) {
                tagsParsed = typeof item.tags === 'string' ? JSON.parse(item.tags) : item.tags;
            }
        } catch { tagsParsed = []; }

        setForm({
            id: getId(item),
            nome: item.nome || '',
            // Campos de Locais e Tags
            descricao: item.descricao || '', 
            // Campos de Personagens
            funcao: item.funcao || '',
            localPrincipal: item.localPrincipal || '',
            resumo: item.resumo || '',
            historia: item.historia || '',
            tags: Array.isArray(tagsParsed) ? tagsParsed : []
        });
    };

    const handleEditarTexto = () => {
        preencherFormularioComItemSelecionado(); // Garante os dados antes de abrir
        setModo('editarTexto');
    };

    // NOVO HANDLER: Garante que os dados sejam preservados ao editar imagem
    const handleEditarImagemClick = () => {
        preencherFormularioComItemSelecionado(); 
        setModo('editarImagem');
        setArquivo(null);
    };

    const handleSalvar = async (e: FormEvent) => {
        e.preventDefault();
        setSalvando(true);

        try {
            let imagemUrlFinal = (itemSelecionado as any)?.imagemUrl || '';

            if (arquivo) {
                const formData = new FormData();
                formData.append('file', arquivo);
                const uploadRes = await api.post('/imagens/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                
                // CORREÇÃO: Captura o ID e monta a URL estável
                const match = uploadRes.data.toString().match(/ID:\s*(\S+)/);
                if (match && match[1]) {
                    const driveId = match[1];
                    imagemUrlFinal = `https://lh3.googleusercontent.com/d/${driveId}`;
                }
            }

            const payload: any = {
                nome: form.nome,
                imagemUrl: imagemUrlFinal
            };

            if (activeTab === 'personagens') {
                payload.funcao = form.funcao;
                payload.localPrincipal = form.localPrincipal;
                payload.resumo = form.resumo;
                payload.historia = form.historia;
                payload.tags = JSON.stringify(form.tags);
            } else {
                payload.descricao = form.descricao;
            }

            if (modo === 'criar') {
                await api.post(config.endpoint, payload);
            } else {
                const idAtual = getId(itemSelecionado);
                await api.put(`${config.endpoint}/${idAtual}`, payload);
            }

            setModalAberto(false);
            carregarDados();
        } catch (error) {
            console.error(error);
            alert("Erro ao salvar.");
        } finally {
            setSalvando(false);
            setArquivo(null);
        }
    };

    const toggleTag = (t: string) => {
        setForm(prev => ({
            ...prev,
            tags: prev.tags.includes(t) ? prev.tags.filter(x => x !== t) : [...prev.tags, t]
        }));
    };

    return (
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 20px' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '800' }}>Serra Sombria</h1>
                    <span style={{ color: '#64748b' }}>Olá, {user}</span>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={signOut} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}>Sair</button>
                    <button onClick={handleCriar} className="btn-primary" style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer' }}>+ Novo</button>
                </div>
            </header>

            {/* ABAS */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '40px', background: 'white', padding: '6px', borderRadius: '50px', width: 'fit-content' }}>
                {(['locais', 'personagens', 'tags'] as const).map(tab => (
                    <button key={tab} 
                        onClick={() => setActiveTab(tab)}
                        style={{ 
                            background: activeTab === tab ? '#0f172a' : 'transparent',
                            color: activeTab === tab ? 'white' : '#64748b',
                            border: 'none', padding: '8px 20px', borderRadius: '20px', cursor: 'pointer', fontWeight: '600'
                        }}>
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {/* LISTAGEM */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '30px' }}>
                {carregando ? <p>Conectando ao universo...</p> : items.map((item: any) => {
                    const id = getId(item);
                    const imgUrl = getDriveImageUrl(item.imagemUrl);
                    
                    return (
                        <div key={id} className="card-hover" onClick={() => handleVerDetalhes(item)}
                             style={{ background: 'white', borderRadius: '20px', overflow: 'hidden', cursor: 'pointer', border: '1px solid #f1f5f9' }}>
                            <div style={{ 
                                height: '180px', background: stringToColor(item.nome || id), 
                                backgroundImage: imgUrl ? `url(${imgUrl})` : 'none',
                                backgroundSize: 'cover', backgroundPosition: 'center'
                            }} />
                            <div style={{ padding: '20px' }}>
                                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>{item.nome}</h3>
                                <p style={{ margin: 0, color: '#64748b', fontSize: '14px', height: '40px', overflow: 'hidden' }}>
                                    {activeTab === 'personagens' ? item.funcao : item.descricao}
                                </p>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* MODAL */}
            {modalAberto && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div style={{ background: 'white', width: '90%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '24px', padding: '0' }}>
                        
                        {/* HEADER MODAL */}
                        <div style={{ padding: '24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0 }}>{modo === 'detalhes' ? itemSelecionado?.nome : 'Editor'}</h2>
                            <button onClick={() => setModalAberto(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
                        </div>

                        {/* BODY MODAL */}
                        <div style={{ padding: '32px' }}>
                            {modo === 'detalhes' && itemSelecionado ? (
                                <>
                                    <div style={{ height: '300px', borderRadius: '16px', background: '#f1f5f9', marginBottom: '24px', overflow: 'hidden', position: 'relative' }}>
                                         {itemSelecionado.imagemUrl && (
                                            <img src={getDriveImageUrl(itemSelecionado.imagemUrl) || ''} alt="Capa" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                         )}
                                         {/* BOTÃO CORRIGIDO: Usa o handler que preserva os dados */}
                                         <button onClick={handleEditarImagemClick} style={{ position: 'absolute', top: 10, right: 10, background: 'white', border: 'none', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }}>📷 Alterar</button>
                                    </div>
                                    
                                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, color: '#334155' }}>
                                        {activeTab === 'personagens' ? (
                                            <>
                                                {/* ÁREA DE METADADOS (FUNÇÃO E LOCAL) */}
                                                <div style={{ display: 'flex', gap: '30px', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #f1f5f9' }}>
                                                    <div>
                                                        <span style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Função</span>
                                                        <span style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a' }}>{(itemSelecionado as any).funcao || '-'}</span>
                                                    </div>
                                                    <div>
                                                        <span style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Local Principal</span>
                                                        <span style={{ fontSize: '16px', fontWeight: '600', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                           📍 {(itemSelecionado as any).localPrincipal || 'Desconhecido'}
                                                        </span>
                                                    </div>
                                                </div>

                                                <p><strong>Resumo:</strong> {(itemSelecionado as any).resumo}</p>
                                                
                                                {/* ÁREA DE TAGS */}
                                                {(() => {
                                                    try {
                                                        const rawTags = (itemSelecionado as any).tags;
                                                        const tagsList = typeof rawTags === 'string' ? JSON.parse(rawTags) : rawTags;
                                                        
                                                        if (Array.isArray(tagsList) && tagsList.length > 0) {
                                                            return (
                                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', margin: '20px 0' }}>
                                                                    {tagsList.map((tag: string) => (
                                                                        <span key={tag} style={{ background: '#f1f5f9', color: '#475569', padding: '6px 14px', borderRadius: '99px', fontSize: '13px', fontWeight: '600', border: '1px solid #e2e8f0' }}>
                                                                            #{tag}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            );
                                                        }
                                                    } catch (e) { return null; }
                                                })()}

                                                <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '24px 0' }} />
                                                
                                                <div>
                                                    <span style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>História</span>
                                                    <p style={{ marginTop: 0 }}>{(itemSelecionado as any).historia}</p>
                                                </div>
                                            </>
                                        ) : (itemSelecionado as any).descricao}
                                    </div>

                                    <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #f1f5f9', textAlign: 'right' }}>
                                        <button onClick={handleEditarTexto} className="btn-primary" style={{ padding: '12px 24px', borderRadius: '12px', border: 'none', cursor: 'pointer' }}>Editar Dados</button>
                                    </div>
                                </>
                            ) : (
                                /* FORMULÁRIO (CRIAR / EDITAR) */
                                <form onSubmit={handleSalvar} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    
                                    {modo === 'editarImagem' ? (
                                        <div style={{ border: '2px dashed #cbd5e1', padding: '40px', textAlign: 'center', borderRadius: '16px' }}>
                                            <input type="file" onChange={(e: ChangeEvent<HTMLInputElement>) => setArquivo(e.target.files?.[0] || null)} />
                                            <p>Selecione uma nova imagem para enviar.</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div><label>Nome</label><input className="input-focus" style={{ display: 'block', width: '100%', padding: '10px', background: '#f8fafc', border: '1px solid transparent', borderRadius: '8px' }} value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} /></div>
                                            
                                            {activeTab === 'personagens' ? (
                                                <>
                                                    <div><label>Função</label><input className="input-focus" style={{ display: 'block', width: '100%', padding: '10px', background: '#f8fafc', border: '1px solid transparent', borderRadius: '8px' }} value={form.funcao} onChange={e => setForm({...form, funcao: e.target.value})} /></div>
                                                    <div><label>Local</label>
                                                        <select className="input-focus" style={{ display: 'block', width: '100%', padding: '10px', background: '#f8fafc', border: '1px solid transparent', borderRadius: '8px' }} value={form.localPrincipal} onChange={e => setForm({...form, localPrincipal: e.target.value})}>
                                                            <option value="">Selecione...</option>
                                                            {auxLocais.map(l => <option key={l.idLocal} value={l.nome}>{l.nome}</option>)}
                                                        </select>
                                                    </div>
                                                    <div><label>Resumo</label><textarea rows={3} className="input-focus" style={{ display: 'block', width: '100%', padding: '10px', background: '#f8fafc', border: '1px solid transparent', borderRadius: '8px' }} value={form.resumo} onChange={e => setForm({...form, resumo: e.target.value})} /></div>
                                                    <div><label>História</label><textarea rows={6} className="input-focus" style={{ display: 'block', width: '100%', padding: '10px', background: '#f8fafc', border: '1px solid transparent', borderRadius: '8px' }} value={form.historia} onChange={e => setForm({...form, historia: e.target.value})} /></div>
                                                    <div><label>Tags</label>
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                                                            {auxTags.map(t => (
                                                                <span key={t.idTag} onClick={() => toggleTag(t.nome)}
                                                                    style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer', background: form.tags.includes(t.nome) ? '#0f172a' : '#e2e8f0', color: form.tags.includes(t.nome) ? 'white' : 'black' }}>
                                                                    {t.nome}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </>
                                            ) : (
                                                <div><label>Descrição</label><textarea rows={6} className="input-focus" style={{ display: 'block', width: '100%', padding: '10px', background: '#f8fafc', border: '1px solid transparent', borderRadius: '8px' }} value={form.descricao} onChange={e => setForm({...form, descricao: e.target.value})} /></div>
                                            )}

                                            {modo === 'criar' && (
                                                <div>
                                                    <label>Imagem de Capa (Opcional)</label>
                                                    <input type="file" style={{display: 'block', marginTop: '8px'}} onChange={(e: ChangeEvent<HTMLInputElement>) => setArquivo(e.target.files?.[0] || null)} />
                                                </div>
                                            )}
                                        </>
                                    )}

                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                                        <button type="button" onClick={() => setModo('detalhes')} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>Voltar</button>
                                        <button type="submit" className="btn-primary" disabled={salvando} style={{ padding: '12px 24px', borderRadius: '12px', border: 'none', cursor: 'pointer' }}>{salvando ? 'Salvando...' : 'Confirmar'}</button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- APP WRAPPER ---
export default function App() {
    return (
        <AuthProvider>
            <style>{globalCss}</style>
            <AppConsumer />
        </AuthProvider>
    );
}

// Componente filho para consumir o AuthContext
function AppConsumer() {
    const { signed, loadingAuth } = useAuth();

    if (loadingAuth) return <div style={{height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>Carregando Universo...</div>;

    return signed ? <MainContent /> : <LoginScreen />;
}