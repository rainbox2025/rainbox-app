// connect-outlook/outlook-rainbox-logo.tsx

import { ArrowsRightLeftIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import React from 'react';

export const OutlookRainboxLogosDisplay: React.FC = () => (
  <div className="flex items-center justify-center space-x-3 my-5 p-3  mx-auto w-fit">
    {/* Assuming you have an outlook logo at this path */}
    <Image src="/OutlookLogo.png" alt="outlook-logo" width={50} height={50} className='p-1' />
    <ArrowsRightLeftIcon className="text-primary h-6 w-6 mx-5" />
    <Image src="/RainboxLogo.png" alt="rainbox-logo" width={50} height={50} />
  </div>
);