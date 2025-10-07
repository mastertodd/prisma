// ----------------------------------------------------
// 1. IMPORTS E CONFIGURAÇÃO DE AMBIENTE
// ----------------------------------------------------
const { Client, MessageMedia, RemoteAuth } = require('whatsapp-web.js'); 
const { MongoStore } = require('wwebjs-mongo'); 
const mongoose = require('mongoose');
const qrcode = require('qrcode');
const express = require('express');
const fs = require('fs');
const path = require('path'); 

// Lê as variáveis de ambiente necessárias
const PORT = process.env.PORT || 3000; 
const MONGO_URI = process.env.MONGODB_URI || "mongodb+srv://camiladsetec_db_user:Camila1605m@cluster0.nyiiuv1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"; 

// ----------------------------------------------------
// 2. CONFIGURAÇÃO DO SERVIDOR EXPRESS (Mantém o Render vivo)
// ----------------------------------------------------
const app = express();

// CORREÇÃO: Inicia o servidor Express imediatamente para o Health Check do Render, garantindo que seja chamado APENAS uma vez.
app.listen(PORT, () => {
    console.log(`Servidor Express iniciado e escutando na porta ${PORT}`);
});

app.get('/', (req, res) => {
    res.status(200).send('Chatbot Prisma Projeto de Dança está ativo e conectado ao WhatsApp e MongoDB.');
});

// ----------------------------------------------------
// 3. CONEXÃO COM O BANCO DE DADOS E INICIALIZAÇÃO DO CLIENTE
// ----------------------------------------------------

if (!MONGO_URI) {
    console.error("ERRO: A URI do MongoDB não foi definida. Verifique suas variáveis de ambiente.");
} else {
    mongoose.connect(MONGO_URI)
        .then(() => {
            console.log('✅ Conexão com MongoDB estabelecida com sucesso!');

            // 1. Cria a Store (Loja) do MongoDB usando a classe MongoStore
            const store = new MongoStore({
                mongoose: mongoose 
            });

            // 2. Cria o cliente com a estratégia de autenticação RemoteAuth, usando a Store
            const client = new Client({
                authStrategy: new RemoteAuth({ 
                    store: store,
                    // CORREÇÃO CRÍTICA: Adiciona o intervalo mínimo exigido (60 segundos)
                    backupSyncIntervalMs: 60000 
                }),
                
                // 3. Argumentos do Puppeteer (CRÍTICO para Render/ambientes headless)
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

            // Função auxiliar de delay para simular digitação e dar tempo de resposta
            const delay = ms => new Promise(res => setTimeout(res, ms));


            // 4. Listeners e inicialização
            client.on('qr', async qr => {
                console.log('Gerando QR Code...');
                await qrcode.toFile('qrcode.png', qr, { scale: 10 }); 
                
                console.log('⚠️ QR CODE DETECTADO ⚠️:', qr); 
                console.log('ESCANEIE ESTE CÓDIGO O MAIS RÁPIDO POSSÍVEL!');
            });

            client.on('ready', () => {
                console.log('🟢 WhatsApp conectado com SUCESSO! Sessão salva no MongoDB.');
            });
            
            client.on('auth_failure', msg => {
                console.error('🔴 Falha na autenticação do WhatsApp. Tente escanear o QR Code novamente.', msg);
            });

            client.on('disconnected', (reason) => {
                console.log('🟡 Cliente desconectado. Tentando reconectar...', reason);
            });

            client.initialize();
            

            // ----------------------------------------------------
            // 5. FUNIL DE MENSAGENS E LÓGICA
            // ----------------------------------------------------
            client.on('message', async msg => {
                try {
                    if (!msg.body || msg.isStatus) return;
                    const isPrivateChat = msg.from.endsWith('@c.us');

                    // Função auxiliar para enviar mídia com verificação de arquivo
                    const sendMedia = async (filePath, caption) => {
                        const fullPath = path.join(__dirname, filePath);
                        if (fs.existsSync(fullPath)) {
                            const media = MessageMedia.fromFilePath(fullPath); 
                            await client.sendMessage(msg.from, media, { caption: caption });
                        } else {
                            console.error(`Arquivo não encontrado: ${fullPath}`);
                            await client.sendMessage(msg.from, `Desculpe, o arquivo "${caption}" não foi encontrado no servidor. Verifique a pasta 'imagens'.`);
                        }
                        await delay(2000);
                        const chat = await msg.getChat();
                        await chat.sendStateTyping();
                        await delay(2000);
                    };


                    // A. MENU PRINCIPAL (Aceita palavras-chave)
                    if (msg.body.match(/(menu|Menu|dia|tarde|noite|oi|Oi|Olá|olá|ola|Ola)/i) && isPrivateChat) {
                        const chat = await msg.getChat();
                        await delay(1000);
                        await chat.sendStateTyping();
                        await delay(1000);
                        const contact = await msg.getContact();
                        const name = contact.pushname || 'Pessoa';
                        await client.sendMessage(msg.from, 
                            `Olá! ${name.split(" ")[0]}, tudo bem? Me conta como posso ajudar você! Por favor, digite uma das opções abaixo:\n\n` +
                            '1 - Como funciona\n' +
                            '2 - Valores e informações\n' +
                            '3 - Agendar aula experimental\n' +
                            '4 - Realizar matrícula\n' +
                            '5 - Outras perguntas'
                        );
                        return;
                    }

                    // B. OPÇÃO 1 - Como funciona
                    if (msg.body.trim() === '1' && isPrivateChat) {
                        const chat = await msg.getChat();
                        await delay(1000);
                        await chat.sendStateTyping();
                        await delay(1000);
                        await client.sendMessage(msg.from, 
                            '🌟 Como funciona o Prisma Projeto de Dança:\n\n' +
                            'O Prisma Projeto de Dança oferece aulas para diferentes idades e estilos.\n\n' +
                            '- Ballet: a partir de 3 anos\n' +
                            '- Jazz: a partir de 9 anos\n' +
                            '- Hip Hop: a partir de 5 anos\n\n' +
                            'Também temos turmas para quem já se encontra no mundo da dança:\n' +
                            '- Dança Livre: a partir de 15 anos\n' +
                            '- Hip Hop Adulto: acima de 15 anos\n\n' +
                            'Cada modalidade é planejada para desenvolver técnica, expressão e amor pela dança. 💜'
                        );

                        await delay(1000);
                        await chat.sendStateTyping();
                        await delay(1000);
                        await client.sendMessage(msg.from, 'Digite "Menu" para voltar às opções!');
                        return;
                    }

                    // C. OPÇÃO 2 - Valores e informações (Com verificação de arquivos)
                    if (msg.body.trim() === '2' && isPrivateChat) {
                        await delay(1000);
                        
                        // Cronograma
                        await sendMedia('imagens/Cronograma.jpg', 'Esse é o nosso cronograma.'); 
                        
                        // Valores
                        await sendMedia('imagens/Valores.jpg', 'Esses são os nossos valores.'); 

                        // Turmas
                        const texto3 = 'E essas são as nossas novas turmas, abertas para matrículas de novas alunas do Ballet.🩰';
                        await sendMedia('imagens/Turmas.jpg', texto3); 

                        await client.sendMessage(msg.from, 'Digite "Menu" para voltar às opções!');
                        return;
                    }


                    // D. OPÇÃO 3 - Agendar aula experimental
                    if (msg.body.trim() === '3' && isPrivateChat) {
                        const chat = await msg.getChat();
                        await delay(1000);
                        await chat.sendStateTyping();
                        await delay(1000);
                        await client.sendMessage(msg.from, 
                            'Poderia me informar por gentileza: \n\n' +
                            '• Modalidade desejada \n' +
                            '• Nome completo da aluna \n' +
                            '• Nome completo do reponsável \n' +
                            '• Idade da aluna'
                        );

                        await delay(1000);
                        await chat.sendStateTyping();
                        await delay(1000);
                        await client.sendMessage(msg.from, 
                            'Após enviar essas informações, peço que aguarde um instante.🌟\n \n' +
                            '*Em breve, um de nossos agentes administrativos irá atendê-lo com todo cuidado e atenção.*'
                        );
                        return;
                    }

                    // E. OPÇÃO 4 - Realizar matrícula
                    if (msg.body.trim() === '4' && isPrivateChat) {
                        const chat = await msg.getChat();
                        await delay(1000);
                        await chat.sendStateTyping();
                        await delay(1000);
                        await client.sendMessage(msg.from, 'Por favor, aguarde um instante. Um agente administrativo irá atendê-lo em breve.🌟');
                        return;
                    }

                    // F. OPÇÃO 5 - Outras perguntas
                    if (msg.body.trim() === '5' && isPrivateChat) {
                        const chat = await msg.getChat();
                        await delay(1000);
                        await chat.sendStateTyping();
                        await delay(1000);
                        await client.sendMessage(msg.from, 
                            'Se tiver qualquer dúvida ou precisar de mais informações, estamos à disposição! Você pode nos enviar uma mensagem por aqui ou visitar nosso Instagram: \n \n' +
                            'https://www.instagram.com/prismaprojetodedanca?igsh=bTNsaTZ6Znlocm5y'
                        );

                        await delay(1000);
                        await chat.sendStateTyping();
                        await delay(1000);
                        await client.sendMessage(msg.from, 'Por favor, aguarde um instante. Um agente administrativo irá atendê-lo em breve.🌟');
                        return;
                    }
                } catch (error) {
                    console.error("Erro ao processar mensagem:", error);
                }
            });


        })
        .catch(err => {
            console.error('🔴 ERRO FATAL: Não foi possível conectar ao MongoDB.', err);
            // CORREÇÃO: Removemos a chamada app.listen daqui, pois ela já está no início do script.
        });
}


// ----------------------------------------------------
// 6. OBSERVAÇÃO: A inicialização do Express foi movida para o topo (Linha 25)
// ----------------------------------------------------
