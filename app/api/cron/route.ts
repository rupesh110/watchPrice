import Product from "@/lib/models/product.model";
import { connectToDB } from "@/lib/mongoose"
import { generateEmailBody, sendEmail } from "@/lib/nodemailer";
import { scrapeAmazonProduct } from "@/lib/scrapper";
import { getAveragePrice, getEmailNotifType, getHighestPrice, getLowestPrice } from "@/lib/utils";
import { NextResponse } from "next/server";
import { title } from "process";

export async function GET(){
    try{
        connectToDB();

        const products = await Product.find({});

        if(!products) throw new Error("No products found");

        //Scrape latest product details and update the database
        const updatedProducts =  await Promise.all
            (products.map(async (currentProduct) => {
                const scrapedProduct = await scrapeAmazonProduct(currentProduct.url);

            if(!scrapedProduct) throw new Error("No product found");

            const updatedPriceHistory = [
                ...currentProduct.priceHistory,
                { price: currentProduct.currentPrice }
              ]
        
            const product = {
                ...scrapedProduct,
                priceHistory: updatedPriceHistory,
                lowestPrice: getLowestPrice(updatedPriceHistory),
                highestPrice: getHighestPrice(updatedPriceHistory),
                averagePrice: getAveragePrice(updatedPriceHistory),
            }
        
            const updatedProduct = await Product.findOneAndUpdate(
              { url: scrapedProduct.url },
              product,
            )


            //check if the product is in stock
            const emailNotifType = getEmailNotifType(scrapedProduct, currentProduct)

            //Send email notification if the product is in stock
            if(emailNotifType && updatedProduct.users.length > 0){
                const productInfo = {
                    title: updatedProduct.title,
                    url: updatedProduct.url,
                }

                const emailContent = await generateEmailBody(productInfo, emailNotifType); 

                const userEmails = updatedProduct.users.map((user:any) => user.email);

                await sendEmail(emailContent, userEmails);
                 
            }
            return updatedProduct; 
        }))

        return NextResponse.json({
            message: 'Ok', data: updatedProducts
        })

    }catch(error){
        throw new Error(`Error in GET: ${error}`)
    }
}