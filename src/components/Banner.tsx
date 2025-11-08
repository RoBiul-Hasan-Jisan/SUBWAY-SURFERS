import { Link } from "react-router-dom";

const Banner = () => {
  return (
    <div
      className="banner-thing w-full flex flex-col justify-end items-center bg-cover bg-center relative"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')",
        height: "66vh", // 2/3 of screen height
      }}
    >
      {/* Text Container */}
      <div className="text-stuff mb-4 text-center">
        <h2 className="text-center text-6xl font-black tracking-[5px] leading-[55px] max-sm:text-4xl max-[400px]:text-2xl max-[400px]:tracking-[10px]">
  <span className="text-teal-500">FASHION</span> <br />
  <span className="text-yellow-400 italic">COLLECTION</span>
</h2>

        <h3 className="text-white text-2xl font-light leading-[50px] tracking-[3px] max-sm:text-lg max-[400px]:text-sm max-[400px]:leading-[30px] bg-black bg-opacity-50 px-4 py-1 rounded-full mt-2">
           Premium Quality 
        </h3>
      </div>

      {/* Buttons */}
      <div className="flex justify-center items-center gap-5 pb-12 max-[400px]:flex-col max-[400px]:gap-3 w-[90%] max-w-2xl">
        <Link
          to="/shop"
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xl font-bold tracking-[2px] w-48 h-14 flex items-center justify-center rounded-full shadow-2xl hover:scale-110 transition-all duration-300 border-2 border-yellow-400"
        >
           SHOP NOW
        </Link>

        <Link
          to="/collection"
          className="bg-transparent text-white text-lg font-medium tracking-[1px] w-48 h-12 flex items-center justify-center rounded-lg hover:bg-white hover:text-black transition-all duration-500 border-2 border-white border-dashed"
        >
           BROWSE ALL
        </Link>
      </div>

      {/* Floating elements */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-red-500 rounded-full opacity-20 animate-bounce"></div>
      <div className="absolute bottom-20 right-15 w-16 h-16 bg-blue-500 rounded-lg opacity-30 animate-pulse"></div>
    </div>
  );
};

export default Banner;
