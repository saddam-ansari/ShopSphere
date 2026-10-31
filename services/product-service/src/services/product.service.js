import {
    createProduct, getAllProducts, findProductById,
    updateProduct, deleteProduct, decreaseProductStock,
    increaseProductStock
} from "../repositories/product.repository.js";

export const addProduct = async (productData) => {
    const { name, description, price, stock, category } = productData;

    if (!name || price == undefined) {
        throw new Error("Name and price are required");
    }

    if (price < 0) {
        throw new Error("Price cannot be negative");
    }

    if (stock !== undefined && stock < 0) {
        throw new Error("Stock cannot be negative");
    }

    return await createProduct({
        name,
        description,
        price,
        stock: stock ?? 0,
        category
    });
};

export const listProducts = async () => {
    return await getAllProducts();
};

export const getProduct = async (id) => {

    const product = await findProductById(id);

    if (!product) {
        throw new Error("Product not found");
    }

    return product;
};

export const editProduct = async (id, productData) => {
    const existingProduct = await findProductById(id);

    if (!existingProduct) {
        throw new Error("Product not found");
    }

    const updatedProduct = await updateProduct(id, productData);
    console.log(updatedProduct);

    return updatedProduct;
};

export const removeProduct = async (id) => {
    const existingProduct = await findProductById(id);

    if (!existingProduct) {
        throw new Error("Product not found");
    }

    return await deleteProduct(id);
};

export const reserveProductStock = async (productId, quantity) => {
    if (!Number.isInteger(quantity) || quantity <= 0) {
        throw new Error("Quantity must be a positive integer");
    }

    const product = await decreaseProductStock(productId, quantity);

    if (!product) {
        const existingProduct = await findProductById(productId);

        if (!existingProduct) {
            throw new Error("Product not found");
        }

        throw new Error("Insufficient stock");
    }

    return product;
};


export const restoreProductStock = async (productId, quantity) => {
    if (!Number.isSafeInteger(productId) || productId <= 0) {
        throw new Error("Invalid product ID");
    }

    if (!Number.isSafeInteger(quantity) || quantity <= 0) {
        throw new Error("Quantity must be a positive integer");
    }

    const product = await increaseProductStock(productId, quantity);

    if (!product) {
        throw new Error("Product not found");
    }

    return product;
};
