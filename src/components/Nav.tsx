'use client'

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // useRouter import

export default function Nav() {
  const router = useRouter(); // useRouter 훅
  const categories = [
    { name: "옵션1", href: "/option1" },
    { name: "옵션2", href: "/option2" },
    { name: "옵션3", href: "/option3" },
    { name: "옵션4", href: "/option4" },
  ];

  return (
    <header className="mt-3 w-full min-h-15 flex justify-between items-center bg-white text-gray-600 relative">
      <div className="flex ml-10 cursor-pointer" onClick={() => router.push('/')}>
        <Image src="/image/home2.png" width={30} height={30} alt='home' />
      </div>

      <div className="text-gray-600 font-bold text-xs">
        <ul className="flex justify-center items-center gap-3">
          {/* <Link href="/" className='mr-1 text-gray-600 hover:text-gray-800 transition-colors'>Home</Link> */}
          <p className='text-gray-600 text-xl justify-center items-center'>Team Name</p>
        </ul>
      </div>

      {/* 메뉴 hover 그룹 */}
      <div className="relative group mr-5 cursor-pointer">
        <Image src="/image/back.png" width={25} height={25} alt="back" onClick={()=>router.back()}/>

        {/* 오른쪽 슬라이드 메뉴 (hover 시 나타남) */}
        {/* <div className="fixed top-0 right-0 h-full w-60 bg-white shadow-lg p-6
                transform translate-x-full group-hover:translate-x-0
                transition-transform duration-300 z-50">
          <h2 className="text-lg font-bold mb-4 text-gray-600">카테고리</h2>
          <ul className="flex flex-col gap-3">
            {categories.map(cat => (
              <li key={cat.name}>
                <Link
                  href={cat.href}
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </div> */}

      </div>
    </header>
  )
}
