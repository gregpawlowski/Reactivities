using System.Linq;
using AutoMapper;
using Domain;

namespace Application.Comments
{
  public class MappingProfile : Profile
  {
    public MappingProfile()
    {
        CreateMap<Comment, CommentDto>()
            .ForMember(d => d.Username, opt => opt.MapFrom(s => s.Author.UserName))
            .ForMember(d => d.DisplayName, opt => opt.MapFrom(s => s.Author.DisplayName))
            .ForMember(d => d.Image, opt => opt.MapFrom(s => s.Author.Photos.FirstOrDefault(x => x.IsMain).Url));
    }
  }
}