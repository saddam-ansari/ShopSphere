import amqp from "amqplib";

let channel;

export const connectRabbitMQ = async () => {
    try {
        const connection = await amqp.connect(process.env.RABBITMQ_URL);

        channel = await connection.createChannel();
        console.log("Connected to RabbitMQ");
        return channel;
    } catch (error) {
        console.error("RabbitMQ connection failed:", error.message);

        throw error;
    }
};

export const getChannel = () => {
    if (!channel) {
        throw new Error("RabbitMQ channel is not initialized");
    }

    return channel;
};