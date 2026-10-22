export const desafio = {
nome: "Treino de entrevista",
subtitulo: "Cole a vaga, responda e receba um retorno honesto",
botao: "Avaliar minhas respostas",
campos: [
{ id: "vaga", rotulo: "Cole aqui a descrição da vaga", linhas: 5 },
{ id: "resposta1", rotulo: "Me fale um pouco sobre você", linhas: 4 },
{ id: "resposta2", rotulo: "Por que você quer esta vaga?", linhas: 4 },
{ id: "resposta3", rotulo: "Conte uma situação difícil que você resolveu", linhas: 4 }
],
modelo: "openrouter/free",
modoTeste: true,
aviso: "Esta resposta foi escrita por uma inteligência artificial e pode conter erros. Use como ajuda, não como decisão final. O que você digitar fica guardado na sua conta e só você consegue ver.",
prompt: `Você é um entrevistador experiente treinando jovens de 14 a 18 anos para a primeira
entrevista de emprego.
A pessoa respondeu três perguntas para a vaga abaixo. Avalie cada resposta assim:
RESPOSTA 1
NOTA: de 0 a 10
O QUE FICOU BOM: 1 frase específica, citando algo que ela escreveu
O QUE MELHORAR: 1 frase concreta
COMO FICARIA MELHOR: reescreva a resposta em até 3 frases, mantendo a história que ela contou
Repita para RESPOSTA 2 e RESPOSTA 3. No fim, uma linha de incentivo verdadeira.
REGRAS
- Nunca invente experiência que ela não contou.
- Nota alta só com resposta concreta. Elogio vazio não ajuda.
- Resposta em branco ou de uma palavra: nota de 0 a 3, explicando por quê.
- Nunca use ironia nem humilhe.
- Português simples, sem jargão de RH.
VAGA: {vaga}
RESPOSTA 1 (sobre você): {resposta1}
RESPOSTA 2 (por que esta vaga): {resposta2}
RESPOSTA 3 (situação difícil): {resposta3}`
};
