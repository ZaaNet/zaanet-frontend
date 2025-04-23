'use client'

import { Wifi } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const HeroSection = () => {
  return (
    <section className="bg-gradient-to-br from-white to-zaanet-purple-light py-20">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-10 md:mb-0">
            <h1 className="text-4xl md:text-5xl font-bold font-heading mb-6">
              Connect and Share Internet, <span className="text-zaanet-purple">Decentralized</span>
            </h1>
            <p className="text-lg mb-8 text-gray-600 max-w-md">
              ZaaNet enables WiFi sharing in underserved communities, bringing affordable internet access through peer-to-peer connections.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button className="bg-zaanet-purple hover:bg-zaanet-purple-dark font-medium text-white px-8 py-6">
                <Link href="/browse">Find WiFi</Link>
              </Button>
              <Button variant="outline" className="bg-white text-zaanet-purple border-zaanet-purple hover:bg-zaanet-purple hover:text-white px-8 py-6">
                <Link href="/become-host">Become a Host</Link>
              </Button>
            </div>
          </div>

          <div className="md:w-1/2 flex justify-center">
            <div className="relative w-full max-w-lg">
              {/* Blobs */}
              <div className="absolute top-0 -left-4 w-72 h-72 bg-zaanet-purple-light rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
              <div className="absolute top-0 -right-4 w-72 h-72 bg-zaanet-blue rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
              <div className="absolute -bottom-8 left-20 w-72 h-72 bg-zaanet-yellow rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

              {/* Card */}
              <div className="relative bg-white rounded-lg shadow-xl px-8 py-10 border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-zaanet-purple-light flex items-center justify-center">
                      <Wifi className="text-zaanet-purple w-5 h-5" />
                    </div>
                    <div className="ml-3">
                      <h3 className="font-medium">Ghana Coffee Shop</h3>
                      <p className="text-xs text-gray-500">Tamale, Ghana</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-zaanet-purple-dark">0.5 USDT/hr</span>
                </div>

                <div className="bg-gray-50 rounded-md p-3 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Speed</span>
                    <span className="text-sm">10 Mbps</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div className="bg-zaanet-purple h-2 rounded-full" style={{ width: '70%' }} />
                  </div>
                </div>

                <Button className="w-full bg-zaanet-purple hover:bg-zaanet-purple-dark text-white">
                  Connect Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
