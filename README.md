# SESIVERSO • Linguagem dos Sinos

Site estático pronto para GitHub Pages.

## Estrutura

- `index.html` — página principal
- `assets/style.css` — visual do site
- `assets/app.js` — interações, player e quiz
- `assets/data.js` — cadastro dos toques
- `assets/audio/` — coloque aqui seus arquivos MP3 ou WAV
- `assets/img/` — pasta reservada pa   ra imagens futuras

## Como cadastrar os áudios

1. Copie os arquivos para `assets/audio/`.
2. Abra `assets/data.js`.
3. Para cada toque, informe:
   - `id`
   - `nome`
   - `categoria`
   - `arquivo`
   - `descricao`

Exemplo:

```js
{
  id: "angelus",
  nome: "Angelus",
  categoria: "Religioso",
  arquivo: "assets/audio/angelus.mp3",
  descricao: "Descrição do significado deste toque."
}
```

## GitHub Pages

Suba todos os arquivos para o repositório. Depois, no GitHub:

Settings → Pages → Deploy from a branch → `main` → `/root`.

Não é necessário servidor, PHP ou banco de dados.


## Conteúdo atual

Os 7 áudios reais enviados já estão organizados em `assets/audio/` e vinculados aos cards. Cada card possui uma nuvem **Conheça este toque**, que abre a explicação completa. Os textos e caminhos ficam centralizados em `assets/data.js`.


## Versão otimizada para GitHub Pages
As imagens foram convertidas para WebP e os áudios para MP3 128 kbps, reduzindo bastante o tamanho sem prejudicar o uso no site. O favicon do sino também já está configurado.
