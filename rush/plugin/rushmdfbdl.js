import pkg, { prepareWAMessageMedia } from '@whiskeysockets/baileys';
const { generateWAMessageFromContent, proto } = pkg;
import getFBInfo from '@xaviabot/fb-downloader';

const fbSearchResultsMap = new Map();
let fbSearchrush = 1;

const facebookCommand = async (m, Matrix) => {
  let selectedListId;
  const selectedButtonId = m?.message?.templateButtonReplyMessage?.selectedId;
  const interactiveResponseMessage = m?.message?.interactiveResponseMessage;

  if (interactiveResponseMessage) {
    const paramsJson = interactiveResponseMessage.nativeFlowResponseMessage?.paramsJson;
    if (paramsJson) {
      const params = JSON.parse(paramsJson);
      selectedListId = params.id;
    }
  }

  const selectedId = selectedListId || selectedButtonId;

  const prefixMatch = m.body.match(/^[\\/!#.]/);
  const prefix = prefixMatch ? prefixMatch[0] : '/';
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
  const text = m.body.slice(prefix.length + cmd.length).trim();

  const validCommands = ['rushfb'];

  if (validCommands.includes(cmd)) {
    if (!text) {
      return m.reply('ඔබට අවශය වීඩියෝව සපයන අපගේ suvi tech youtube නාලිකාව subcribe කරන්න😃.');
    }

    try {
      await m.React("✨");

      const fbData = await getFBInfo(text);
      console.log("fbData:", fbData);  // Log the data structure

      if (!fbData) {
        await m.reply('No results found.');
        await m.React("❌");
        return;
      }

      fbSearchResultsMap.set(fbSearchrush, fbData);

      const videoQualities = [];
      if (fbData.sd) {
        videoQualities.push({ resolution: 'Suvi tech youtube', url: fbData.sd });
      }
      if (fbData.hd) {
        videoQualities.push({ resolution: 'RUSH MD WA BOT', url: fbData.hd });
      }

      const buttons = videoQualities.map((video, rush) => ({
        "name": "quick_reply",
        "buttonParamsJson": JSON.stringify({
          display_text: `✨ Download ${video.resolution}`,
          id: `media_${rush}_${fbSearchrush}`
        })
      }));

      const sections = videoQualities.map((video) => ({
        title: 'Video Qualities',
        rows: [{
          title: `✨ Download ${video.resolution}`,
          description: `Resolution: ${video.resolution}`,
          id: `media_${fbSearchrush}_${video.resolution}`
        }]
      }));

      const msg = generateWAMessageFromContent(m.from, {
        viewOnceMessage: {
          message: {
            messageContextInfo: {
              deviceListMetadata: {},
              deviceListMetadataVersion: 2
            },
            interactiveMessage: proto.Message.InteractiveMessage.create({
              body: proto.Message.InteractiveMessage.Body.create({
                text: `*RUSH-MD subcribe now suvi tech*\n\n> *TITLE*: ${fbData.title}`
              }),
              footer: proto.Message.InteractiveMessage.Footer.create({
                text: "© Powered By RUSH-MD"
              }),
              header: proto.Message.InteractiveMessage.Header.create({
                ...(await prepareWAMessageMedia({ image: { url: fbData.thumbnail } }, { upload: Matrix.waUploadToServer })),
                title: "",
                gifPlayback: true,
                subtitle: "",
                hasMediaAttachment: false 
              }),
              nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                buttons
              }),
              contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 9999,
                isForwarded: true,
              }
            }),
          },
        },
      }, {});

      await Matrix.relayMessage(msg.key.remoteJid, msg.message, {
        messageId: msg.key.id
      });
      await m.React("〽️");

      fbSearchrush += 1; 
    } catch (error) {
      console.error("Error processing your request:", error);
      await m.reply('Error processing your request.');
      await m.React("❌");
    }
  } else if (selectedId) { 
    if (selectedId.startsWith('media_')) {
      const parts = selectedId.split('_');
      const qualityrush = parseInt(parts[1]);
      const key = parseInt(parts[2]);
      const selectedMedia = fbSearchResultsMap.get(key);

      if (selectedMedia) {
        try {
          const videoQualities = [];
          if (selectedMedia.sd) {
            videoQualities.push({ resolution: 'SD', url: selectedMedia.sd });
          }
          if (selectedMedia.hd) {
            videoQualities.push({ resolution: 'HD', url: selectedMedia.hd });
          }

          const videoUrl = videoQualities[qualityrush].url;
          let finalMediaBuffer, mimeType, content;

          finalMediaBuffer = await getStreamBuffer(videoUrl);
          mimeType = 'video/mp4';

          const fileSizeInMB = finalMediaBuffer.length / (1024 * 1024);

          if (fileSizeInMB <= 300) {
            content = { 
              video: finalMediaBuffer, 
              mimetype: 'video/mp4', 
              caption: '> © Powered by RUSH-MD',
            };
            await Matrix.sendMessage(m.from, content, { quoted: m });
          } else {
            await m.reply('The video file size exceeds 300MB.');
          }
        } catch (error) {
          console.error("Subcribe now suvi tech:", error);
          await m.reply('Subcribe now suvi tech දැන්ම අපව දිරි ගන්නවන්න දයක වන්න😃.');
          await m.React("❌");
        }
      }
    }
  }
};

const getStreamBuffer = async (url) => {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer);
};

export default facebookCommand;
