import Product from "@/lib/models/product.model";
import { connectToDB } from "@/lib/mongoose";
import { generateEmailBody, sendEmail } from "@/lib/nodemailer";
import { scrapeAmazonProduct } from "@/lib/scrapper";
import { getAveragePrice, getEmailNotifType, getHighestPrice, getLowestPrice } from "@/lib/utils";
import { NextResponse } from "next/server";

export const maxDuration = 300;
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {  // <-- add appropriate return type
    try {
        connectToDB();

        const products = await Product.find({});

        if (!products) throw new Error("No products found");

        const updatedProducts = await Promise.all(products.map(async (currentProduct: any) => {  // <-- add appropriate type
            const scrapedProduct = await scrapeAmazonProduct(currentProduct.url);

            if (!scrapedProduct) return;

            const updatedPriceHistory = [
                ...currentProduct.priceHistory,
                { price: scrapedProduct.currentPrice },  // <-- updated this line
            ];

            const product = {
                ...scrapedProduct,
                priceHistory: updatedPriceHistory,
                lowestPrice: getLowestPrice(updatedPriceHistory),
                highestPrice: getHighestPrice(updatedPriceHistory),
                averagePrice: getAveragePrice(updatedPriceHistory),
            };

            const updatedProduct = await Product.findOneAndUpdate(
                { url: product.url },
                product,
                { new: true }
            );

            if (updatedProduct?.users.length > 0) {
                const emailNotifType = getEmailNotifType(scrapedProduct, currentProduct);

                if (emailNotifType) {
                    const productInfo = {
                        title: updatedProduct.title,
                        url: updatedProduct.url,
                    };

                    const emailContent = await generateEmailBody(productInfo, emailNotifType);

                    const userEmails = updatedProduct.users.map((user: any) => user.email);  // <-- add appropriate type

                    await sendEmail(emailContent, userEmails);
                }
            }
            return updatedProduct;
        }));

        return NextResponse.json({
            message: 'Ok',
            data: updatedProducts,
        });
    } catch (error: any) {  // <-- add appropriate type
        throw new Error(`Error in GET: ${error}`);
    }
}
