export interface Personagem {
  id: string; // Java: private String id;
  nome: string;
  funcao: string;
  localPrincipal: string;
  resumo: string;
  historia: string;
  tags: string; // No Java é String, aqui vamos tratar a conversão JSON/String
  imagemUrl: string;
  ultimaAtualizacao: string;
}

export interface Local {
  idLocal: string; // Java: private String idLocal;
  nome: string;
  descricao: string;
  imagemUrl: string;
  ultimaAtualizacao: string;
}

export interface Tag {
  idTag: string; // Java: private String idTag;
  nome: string;
  descricao: string;
  imagemUrl: string;
  ultimaAtualizacao: string;
}

// Tipo unificado para facilitar o manuseio no App
export type Entity = Personagem | Local | Tag;