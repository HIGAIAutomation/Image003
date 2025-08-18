import React, { useState, useRef } from 'react';
import { Spin, message, Modal } from 'antd';
import { AiOutlineCloudUpload } from 'react-icons/ai';
import ReactCrop, { Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

const MemberRegistration = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    designation: [] as string[],
    photo: null as File | null,
  });
  
  const [cropModalVisible, setCropModalVisible] = useState(false);
  const [srcImage, setSrcImage] = useState('');
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 90,
    aspect: 1,
  });
  const [completedCrop, setCompletedCrop] = useState<any>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const imgRef = useRef<HTMLImageElement>(null);

  const [loading, setLoading] = useState(false);

  const getCroppedImage = async (image: HTMLImageElement, crop: any) => {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width,
        crop.height
      );

      return new Promise<File>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'cropped-image.jpg', {
              type: 'image/jpeg',
            });
            resolve(file);
          }
        }, 'image/jpeg', 1);
      });
    }
    throw new Error('Could not get canvas context');
  };

  const handleCropComplete = async () => {
    if (imgRef.current && completedCrop?.width && completedCrop?.height) {
      try {
        const croppedImage = await getCroppedImage(imgRef.current, completedCrop);
        setFormData({ ...formData, photo: croppedImage });
        
        // Create preview URL
        const reader = new FileReader();
        reader.onload = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(croppedImage);
        
        setCropModalVisible(false);
        setSrcImage('');
      } catch (error) {
        message.error('Failed to crop image');
      }
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, files } = e.target as any;

    if (name === 'photo') {
      if (files?.[0]) {
        const reader = new FileReader();
        reader.onload = () => {
          setSrcImage(reader.result as string);
          setCropModalVisible(true);
        };
        reader.readAsDataURL(files[0]);
      }
    } else if (name === 'designation') {
      if (value === 'Both') {
        setFormData({
          ...formData,
          designation: ['Health insurance advisor', 'Wealth Manager'],
        });
      } else {
        setFormData({ ...formData, designation: [value] });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.photo) {
        message.warning('⚠️ Please select a photo.');
        return;
      }

      const data = new FormData();
      data.append('name', formData.name.trim());
      data.append('phone', formData.phone.trim());
      data.append('email', formData.email.trim());
      data.append('designation', formData.designation.join(','));
      data.append('photo', formData.photo);

      const API_URL = import.meta.env.VITE_API_URL;
      const res = await fetch(`${API_URL}api/register`, {
        method: 'POST',
        body: data,
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to register member');
      }

      message.success('Registration successful!');
      setFormData({
        name: '',
        phone: '',
        email: '',
        designation: [],
        photo: null,
      });
      setPreviewUrl('');
    } catch (err) {
      console.error('Registration error:', err);
      message.error(err instanceof Error ? err.message : '❌ Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-1">
      <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-lg">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Register New Member
        </h2>

        <div className="space-y-5">
          <input
            name="name"
            type="text"
            value={formData.name}
            placeholder="Full Name"
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            name="phone"
            type="Number"
            value={formData.phone}
            placeholder="Phone Number"
            onChange={handleInputChange}
            minLength={10}
            maxLength={12}
            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            name="email"
            type="email"
            value={formData.email}
            placeholder="Email"
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <select
            name="designation"
            value={
              formData.designation.length === 2
                ? 'Both'
                : formData.designation[0] || ''
            }
            onChange={handleInputChange}
            className="w-full max-w-[220px] text-sm p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 mx-auto md:text-base md:max-w-full"
            style={{ maxWidth: 220 }}
          >
            <option value="">Select Designation</option>
            <option value="Health insurance advisor">
              Health insurance advisor
            </option>
            <option value="Wealth Manager">Wealth Manager</option>
            <option value="Partner">Partner</option>
            <option value="Both">Health & Life </option>
          </select>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-blue-600 font-medium">
                <AiOutlineCloudUpload className="text-xl" />
                Upload Photo
                <input
                  name="photo"
                  type="file"
                  accept=".jpg,.jpeg"
                  onChange={handleInputChange}
                  className="hidden"
                />
              </label>
              {formData.photo && (
                <span className="text-sm text-gray-500 truncate">
                  {formData.photo.name}
                </span>
              )}
            </div>

            {previewUrl && (
              <div className="flex justify-center">
                <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-blue-500">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-center mt-6">
            {loading ? (
              <Spin />
            ) : (
              <button
                onClick={handleSubmit}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition"
              >
                Submit Registration
              </button>
            )}
          </div>
        </div>
      </div>

      <Modal
        title="Crop Image"
        open={cropModalVisible}
        onOk={handleCropComplete}
        onCancel={() => {
          setCropModalVisible(false);
          setSrcImage('');
        }}
        okText="Crop"
        cancelText="Cancel"
        width={800}
      >
        {srcImage && (
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={1}
            className="max-h-[600px]"
          >
            <img
              ref={imgRef}
              src={srcImage}
              alt="Upload"
              className="max-w-full h-auto"
            />
          </ReactCrop>
        )}
      </Modal>
    </div>
  );
};

export default MemberRegistration;
