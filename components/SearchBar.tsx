"use client"
import { scrapeAndStoreProduct } from '@/lib/actions';
import React, { FormEvent } from 'react'


const isValidAMazonProductLink  = (url: string) => {
    try{
      const parsedUrl = new URL(url);
      const hostname = parsedUrl.hostname;

      if(
        hostname.includes('amazon.com') || 
        hostname.includes('amazon.') || 
        (hostname.endsWith('amazon'))){
        return true
      }
    }catch(error){
        return false
    }
    return false
}
const SearchBar = () => {
    const [ searchPrompt, setSearchPrompt ] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);

    const handleSubmit = async(event: FormEvent<HTMLFormElement>) =>{
        event.preventDefault()
        
        const isValidLink = isValidAMazonProductLink(searchPrompt);

        if(!isValidLink){
          return alert('Please provide a valid Amazon Product Link')
        }

        try{
          setIsLoading(true)
         
          //Scrape the product page
          const product = await scrapeAndStoreProduct(searchPrompt)
        }catch(error){
          console.error(error)
        }finally{
          setIsLoading(false)
        }
    }
  return (
    <form 
        className='flex flex-wrap gap-4 mt-12'
        onSubmit={handleSubmit}
    >
        <input 
            type='text'
            value={searchPrompt}
            onChange={(e) => setSearchPrompt(e.target.value)}
            placeholder='Enter Product Link'
            className='searchbar-input'
        />
      
      <button 
        type='submit' 
        className='searchbar-btn'
        disabled={searchPrompt === ''}
      >
        {isLoading ? 'Searching...' : 'Search'}
        </button>
        

    </form >
  )
}

export default SearchBar
