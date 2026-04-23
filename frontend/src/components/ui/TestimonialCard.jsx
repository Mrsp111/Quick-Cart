
import { FaCheckCircle } from "react-icons/fa";

const TestimonialCard = ({ name, feedback, isVerified }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="font-semibold text-lg flex items-center gap-2">
        {name}
        {isVerified && <FaCheckCircle className="text-green-600" />}
      </h3>
      <p className="mt-2 text-gray-700 italic">"{feedback}"</p>
    </div>
  );
};

export default TestimonialCard;
