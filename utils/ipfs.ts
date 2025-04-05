export const uploadToIPFS = async (
    fileUri: string,
    onProgress?: (percent: number) => void
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
  
      formData.append("file", {
        uri: fileUri,
        name: "upload.jpg",
        type: "image/jpeg",
      } as any);
  
      xhr.open("POST", "http://192.168.112.238:5001/api/v0/add");
  
      xhr.onload = () => {
        try {
          const resText = xhr.responseText;
          const match =
            resText.match(/\"Hash\":\"([^\"]+)\"/) || resText.match(/([a-zA-Z0-9]{46})/);
          if (!match) throw new Error("CID not found in response");
          resolve(match[1]);
        } catch (e) {
          reject(new Error("Could not parse IPFS response"));
        }
      };
  
      xhr.onerror = () => reject(new Error("Upload failed"));
  
      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = (e.loaded / e.total) * 100;
            onProgress(Math.round(percent));
          }
        };
      }
  
      xhr.send(formData);
    });
  };
  