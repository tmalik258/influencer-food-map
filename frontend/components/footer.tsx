import Image from "next/image";

const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-purple-800 to-black text-white py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between mb-8">
          {/* Logo and Name */}
          <div className="flex items-center space-x-2">
            <Image height={50} width={50} src="/globe.svg" alt="Logo" className="h-8 w-8" />

            <span className="text-2xl font-bold">FoodTuber</span>
          </div>

          {/* Navigation Links */}
          <nav className="space-x-4">
            <a href="#" className="hover:underline">Home</a>
            <a href="#" className="hover:underline">About</a>
            <a href="#" className="hover:underline">Services</a>
            <a href="#" className="hover:underline">Contact</a>
          </nav>

          {/* Social Media Links */}
          <div className="flex space-x-4">
            <a href="#" className="text-white hover:text-gray-300"><i className="fab fa-facebook-f"></i></a>
            <a href="#" className="text-white hover:text-gray-300"><i className="fab fa-twitter"></i></a>
            <a href="#" className="text-white hover:text-gray-300"><i className="fab fa-instagram"></i></a>
          </div>
        </div>

        {/* Copyright */} 
        <div className="text-center text-gray-400 text-sm">
          © {new Date().getFullYear()} Food Map. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;