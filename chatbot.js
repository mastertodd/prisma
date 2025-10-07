// ----------------------------------------------------
// 1. IMPORTS E CONFIGURAÇÃO DE AMBIENTE
// ----------------------------------------------------
const { Client, MessageMedia } = require('whatsapp-web.js');
const { MongoAuthStrategy } = require('wwebjs-mongo');
const mongoose = require('mongoose');
const qrcode = require('qrcode');
const express = require('express');
const fs = require('fs'); 

// O Render usa a variável de ambiente PORT. Usamos 8080 como fallback local.
const PORT = process.env.PORT || 8080;

// A variável de ambiente MONGO_URI está sendo carregada do Render
const MONGO_URI = process.env.MONGO_URI; 
if (!MONGO_URI) {
    console.error("ERRO FATAL: Variável de ambiente MONGO_URI não está definida.");
    // Terminar o processo se não houver MONGO_URI
    process.exit(1);
}


// ----------------------------------------------------
// 2. CONFIGURAÇÃO DO SERVIDOR EXPRESS (Mantém o Render vivo)
// ----------------------------------------------------
const app = express();
app.get('/', (req, res) => {
    // Resposta de status crucial para o Render
    res.send('Chatbot está ativo e conectado ao WhatsApp e MongoDB.');
});


// ----------------------------------------------------
// 3. CONEXÃO COM O BANCO DE DADOS E INICIALIZAÇÃO DO CLIENTE
// ----------------------------------------------------

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('Conexão com MongoDB estabelecida com sucesso!');

        // Cria o cliente usando a estratégia de autenticação do MongoDB
        const client = new Client({
            // Usa o MongoAuthStrategy para persistir a sessão
            authStrategy: new MongoAuthStrategy({ mongoose: mongoose }),
            // Argumentos do Puppeteer recomendados para ambientes cloud como o Render
            puppeteer: {
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--single-process', 
                ],
            }
        });

        // Listener para o QR Code: Salva como arquivo na primeira vez
        client.on('qr', async qr => {
            console.log('Gerando QR Code...');
            // qrcode.toFile salvará no disco e o MongoAuthStrategy salvará a sessão no DB
            await qrcode.toFile('qrcode.png', qr, { scale: 10 });
            console.log('QR Code salvo como qrcode.png. ESCANEIE ESTE CÓDIGO O MAIS RÁPIDO POSSÍVEL!');
        });

        client.on('ready', () => {
            console.log('WhatsApp conectado com SUCESSO! Sessão salva no MongoDB.');
        });
        
        // Listener de erro de autenticação
        client.on('auth_failure', msg => {
            console.error('Falha na autenticação do WhatsApp. Tente escanear o QR Code novamente.', msg);
        });

        client.on('disconnected', (reason) => {
            console.log('Cliente desconectado.', reason);
        });
        
        client.initialize();
        
        // Função auxiliar de delay
        const delay = ms => new Promise(res => setTimeout(res, ms));


        // ----------------------------------------------------
        // 4. FUNIL DE MENSAGENS E LÓGICA (Seu código original)
        // ----------------------------------------------------
        
        client.on('message', async msg => {

            // Tratamento de mensagens de texto apenas
            if (!msg.body) return;

            // A. MENU PRINCIPAL
            if (msg.body.match(/(menu|Menu|dia|tarde|noite|oi|Oi|Olá|olá|ola|Ola)/i) && msg.from.endsWith('@c.us')) {

                const chat = await msg.getChat();

                await delay(3000);
                await chat.sendStateTyping();
                await delay(3000);
                const contact = await msg.getContact();
                const name = contact.pushname;
                await client.sendMessage(msg.from, 'Olá! ' + name.split(" ")[0] + ', tudo bem? Me conta como posso ajudar você! Por favor, digite uma das opções abaixo:\n\n1 - Como funciona\n2 - Valores e informações\n3 - Agendar aula experimental\n4 - Realizar matrícula\n5 - Outras perguntas');
            }

            // B. OPÇÃO 1 - Como funciona
            if (msg.body === '1' && msg.from.endsWith('@c.us')) {
                const chat = await msg.getChat();

                await delay(3000);
                await chat.sendStateTyping();
                await delay(3000);
                await client.sendMessage(msg.from, '🌟 Como funciona o Prisma Projeto de Dança:');

                await delay(3000);
                await chat.sendStateTyping();
                await delay(3000);
                await client.sendMessage(msg.from, 'O Prisma Projeto de Dança oferece aulas para diferentes idades e estilos.\n\n- Ballet: a partir de 3 anos\n- Jazz: a partir de 9 anos\n- Hip Hop: a partir de 5 anos\n\nTambém temos turmas para quem já se encontra no mundo da dança:\n- Dança Livre: a partir de 15 anos\n- Hip Hop Adulto: acima de 15 anos\n\nCada modalidade é planejada para desenvolver técnica, expressão e amor pela dança. 💜');

                await delay(3000);
                await chat.sendStateTyping();
                await delay(3000);
                await client.sendMessage(msg.from, 'Digite "Menu" para agendar uma aula experimental!');
            }

            // C. OPÇÃO 2 - Valores e informações (Com caminhos corrigidos!)
            if (msg.body === '2' && msg.from.endsWith('@c.us')) {
                const chat = await msg.getChat();

                await delay(3000);
                await chat.sendStateTyping();
                await delay(3000);

                // ATENÇÃO: Caminhos corrigidos para relativos: ./imagens/
                
                // Cronograma
                const imagem = MessageMedia.fromFilePath('./imagens/Cronograma.jpg'); 
                await client.sendMessage(msg.from, imagem, { caption: 'Esse é o nosso cronograma.' });

                await delay(3000);
                await chat.sendStateTyping();
                await delay(3000);

                // Valores
                const imagem2 = MessageMedia.fromFilePath('./imagens/Valores.jpg'); 
                await client.sendMessage(msg.from, imagem2, { caption: 'Esses são os nossos valores.' });

                await delay(3000);
                await chat.sendStateTyping();
                await delay(3000);

                // Turmas
                const imagem3 = MessageMedia.fromFilePath('./imagens/Turmas.jpg'); 
                const texto3 = 'E essas são as nossas novas turmas, abertas para matrículas de novas alunas do Ballet.🩰';
                await client.sendMessage(msg.from, imagem3, { caption: texto3 });

                await delay(3000);
                await chat.sendStateTyping();
                await delay(3000);
                await client.sendMessage(msg.from, 'Digite "Menu" para agendar uma aula experimental!');
            }


            // D. OPÇÃO 3 - Agendar aula experimental
            if (msg.body === '3' && msg.from.endsWith('@c.us')) {
                const chat = await msg.getChat();

                await delay(3000);
                await chat.sendStateTyping();
                await delay(3000);
                await client.sendMessage(msg.from, 'Poderia me informar por gentileza: \n\n•Modalidade desejada \n•Nome completo da aluna \n•Nome completo do reponsável \n•Idade da aluna');

                await delay(3000);
                await chat.sendStateTyping();
                await delay(3000);
                await client.sendMessage(msg.from, 'Após enviar essas informações, peço que aguarde um instante.🌟\n \n*Em breve, um de nossos agentes administrativos irá atendê-lo com todo cuidado e atenção.*');
            }

            // E. OPÇÃO 4 - Realizar matrícula
            if (msg.body === '4' && msg.from.endsWith('@c.us')) {
                const chat = await msg.getChat();

                await delay(3000);
                await chat.sendStateTyping();
                await delay(3000);
                await client.sendMessage(msg.from, 'Por favor, aguarde um instante. Um agente administrativo irá atendê-lo em breve.🌟');
            }

            // F. OPÇÃO 5 - Outras perguntas
            if (msg.body === '5' && msg.from.endsWith('@c.us')) {
                const chat = await msg.getChat();

                await delay(3000);
                await chat.sendStateTyping();
                await delay(3000);
                await client.sendMessage(msg.from, 'Se tiver qualquer dúvida ou precisar de mais informações, estamos à disposição! Você pode nos enviar uma mensagem por aqui ou visitar nosso Instagram: \n \n https://www.instagram.com/prismaprojetodedanca?igsh=bTNsaTZ6Znlocm5y');

                await delay(3000);
                await chat.sendStateTyping();
                await delay(3000);
                await client.sendMessage(msg.from, 'Por favor, aguarde um instante. Um agente administrativo irá atendê-lo em breve.🌟');
            }
        });


    })
    .catch(err => {
        console.error('ERRO FATAL: Não foi possível conectar ao MongoDB.', err);
        // O Express inicia mesmo se o bot falhar, para que o Render não desligue o serviço imediatamente
    });


// ----------------------------------------------------
// 5. INICIALIZAÇÃO DO SERVIDOR EXPRESS
// ----------------------------------------------------
app.listen(PORT, () => {
    console.log(`Servidor Express iniciado e escutando na porta ${PORT}`);
});