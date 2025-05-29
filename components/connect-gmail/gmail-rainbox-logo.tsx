
import { ArrowsRightLeftIcon } from '@heroicons/react/24/outline';
import { ArrowBigLeft } from 'lucide-react';
import Image from 'next/image';
import React from 'react';

export const GmailMecoLogosDisplay: React.FC = () => (
  <div className="flex items-center justify-center space-x-3 my-5 p-3  mx-auto w-fit">
    <Image src="/gmail.webp" alt="gmail-logo" width={50} height={50} className='p-1' />
    <ArrowsRightLeftIcon className="text-primary h-6 w-6 mx-5" />
    <Image src="/RainboxLogo.png" alt="rainbox-logo" width={50} height={50} />
  </div>
);