import Hero from "../components/Hero";
import PackageCoverflow from "../components/PackageCoverflow";
import MonasteryShowcase from "../components/MonasteryShowcase";
import FestivalStory from "../components/FestivalStory";
import WhyChooseUs from "../components/WhyChooseUs";
import Testimonials from "../components/Testimonials";
import OurTeam from "../components/OurTeam";
import HomeEmail from "../components/HomeEmail";
import Chatbot from "../components/Chatbot";

const Home = () => {
  return (
    <>
      <Hero />
      <PackageCoverflow />
      <MonasteryShowcase />
      <FestivalStory />
      <WhyChooseUs />
      <Testimonials />
      <OurTeam />
      <HomeEmail />
      <Chatbot />
    </>
  );
};

export default Home;