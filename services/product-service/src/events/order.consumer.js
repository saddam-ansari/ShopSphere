import { getChannel } from "../config/rabbitmq.js";
import { decreaseProductStock } from "../repositories/product.repository.js";

const EXCHANGE_NAME = "shopsphere.events";
const QUEUE_NAME = "product-service.order-created";

export const startOrderConsumer = async () => {
    const channel = getChannel();

    await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: true });
    const queue = await channel.assertQueue(QUEUE_NAME, { durable: true });
    await channel.bindQueue(queue.queue, EXCHANGE_NAME, "order.created");

    console.log(`Listening for order.created events`);

    channel.consume(queue.queue, async (message) => {
        if (!message) {
            return;
        }

        try {
            const event = JSON.parse(message.content.toString());
            console.log("Received event:", event);
            const { productId, quantity } = event.data;

            const product = await decreaseProductStock(productId, quantity);

            if (!product) {
                console.error(`Unable to decrease stock for product ${productId}`);
                channel.nack(message, false, false);
                return;
            }

            console.log(`Stock updated for product ${product.id}. Remaining stock: ${product.stock}`);
            channel.ack(message);

        } catch (error) {
            console.error("Error processing order.created event:", error.message);
            channel.nack(message, false, false);
        }
    }
    );
};