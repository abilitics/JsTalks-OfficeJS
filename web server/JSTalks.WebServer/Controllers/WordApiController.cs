using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Hosting;
using System.Web.Http;
using System.Web.Http.Cors;

namespace JSTalks.WebServer.Controllers
{
    public class WordApiController : ApiController
    {
        [HttpPost]
        [EnableCors("*", "*", "*")]
        public HttpResponseMessage CreatePost(Post post)
        {
            string folderPath = HostingEnvironment.MapPath("~/Posts");
            string fileName = Path.Combine(folderPath, post.title + ".htm");
            File.WriteAllText(fileName, post.body);

            var allFiles = new DirectoryInfo(folderPath)
                                    .GetFiles("*.htm")
                                    .OrderByDescending(f => f.CreationTime)
                                    .Select(f => f.Name)
                                    .ToList();

            string allFilesContent = string.Join(Environment.NewLine, allFiles);
            File.WriteAllText(Path.Combine(folderPath, "posts.txt"), allFilesContent);

            return Request.CreateResponse(HttpStatusCode.OK, "success");
        }

        [HttpGet]
        [EnableCors("*", "*", "*")]
        public HttpResponseMessage GetAllPosts()
        {
            string folderPath = HostingEnvironment.MapPath("~/Posts");

            var allPosts = new DirectoryInfo(folderPath).GetFiles("*.htm").Select(f => f.Name.Replace(".htm", "")).ToList();

            return Request.CreateResponse(HttpStatusCode.OK, allPosts);
        }

        [HttpGet]
        [EnableCors("*", "*", "*")]
        public HttpResponseMessage GetPost(string post)
        {
            string folderPath = HostingEnvironment.MapPath("~/Posts");

            var postText = File.ReadAllText(new FileInfo(Path.Combine(folderPath, post + ".htm")).FullName);

            return Request.CreateResponse(HttpStatusCode.OK, postText);
        }
    }

    public class Post
    {
        public string title { get; set; }
        public string body { get; set; }
    }
}
