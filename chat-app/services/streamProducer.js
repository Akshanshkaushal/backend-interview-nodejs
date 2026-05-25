const redisClient = require('../config/redis');
const STREAMS = require('../config/streams');

class StreamProducer {
  static async produceMessage(messageData) {
    if (!redisClient.isOpen) return null;

    try {
      return await redisClient.xAdd(STREAMS.MESSAGES, '*', {
        senderId: String(messageData.senderId),
        chatId: String(messageData.chatId || ''),
        receiverId: String(messageData.receiverId || ''),
        content: messageData.content || '',
        mediaUrl: messageData.mediaUrl || '',
        type: messageData.type || 'text',
      });
    } catch (error) {
      console.error('Redis stream write failed:', error.message);
      return null;
    }
  }

  static async getStreamLength() {
    if (!redisClient.isOpen) return 0;
    return redisClient.xLen(STREAMS.MESSAGES);
  }
}

module.exports = StreamProducer;
