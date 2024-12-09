import Appbar from "@/components/Appbar";
import UploadImage from "@/components/UploadImage";
import Image from "next/image";

export default function Home() {
  return (
    <div>
        <Appbar/>
        <UploadImage/>
    </div>
  );
}
