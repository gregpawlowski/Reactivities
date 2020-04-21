using System;
using Application.Interfaces;
using Application.Photos;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;

namespace Infrastructure.Photos
{
  public class PhotoAccessor : IPhotoAccessor
  {
    private readonly Cloudinary _cloudinary;

    // Use IOptions to retrieve our configured options of CloudinarySettings
    public PhotoAccessor(IOptions<CloudinarySettings> config)
    {
        var acc = new Account(
            config.Value.CloudName,
            config.Value.ApiKey,
            config.Value.ApiSecret
        );
        
        // Create a new cloudinary instance by passing in account
        _cloudinary = new Cloudinary(acc);
    }

    public PhotoUploadResult AddPhoto(IFormFile file)
    {
        var uploadResult = new ImageUploadResult();

        if (file.Length > 0)
        {
            // Read file into memmory using a readstream
            // Have to use a using statement becuaes readstream is a disposavble.
            using(var stream = file.OpenReadStream())
            {
                var uploadParams = new ImageUploadParams
                {
                    File = new FileDescription(file.FileName, stream),
                    // Transform the image to cut it off
                    Transformation = new Transformation().Height(500).Width(500).Crop("fill").Gravity("face")
                };

                uploadResult = _cloudinary.Upload(uploadParams);
            }
        }

        if (uploadResult.Error != null)
            throw new Exception(uploadResult.Error.Message);

        // Return a Photo Result Object
        return new PhotoUploadResult
        {
            Url = uploadResult.SecureUri.AbsoluteUri,
            PublicId = uploadResult.PublicId
        };
    }

    public string DeletePhoto(string publicId)
    {
        var deleteParams = new DeletionParams(publicId);

        var result = _cloudinary.Destroy(deleteParams);

        return result.Result == "ok" ? result.Result : null;
    }
  }
}