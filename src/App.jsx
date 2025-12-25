import Search from "./components/search.jsx";
import {useState, useEffect, useRef} from "react";
import Spinner from "./components/spinner.jsx";
import MovieCard from "./components/MovieCard.jsx";
import {useDebounce} from "react-use";
import {getTrendingMovies, updateSearchCount} from "./appwrite.js";

import { gsap } from "gsap";

import { ScrollTrigger } from "gsap/ScrollTrigger";
// ScrollSmoother requires ScrollTrigger
import { ScrollSmoother } from "gsap/ScrollSmoother";
gsap.registerPlugin(ScrollTrigger,ScrollSmoother);


const App = () => {
    const API_BASE_URL = "https://api.themoviedb.org/3";
    const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
    const API_OPTIONS = {
        method: "GET",
        headers: {accept: "application/json", authorization: `Bearer ${API_KEY}`},
    };
    const [searchTerm, setSearchTerm] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [movieList, setMovieList] = useState([]);
    const [trendingMovies, setTrendingMovies] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [debouncedSearchTerm, setdebouncedSearchTerm] = useState('');

    const trendingRef = useRef(null);
    const allMoviesRef = useRef(null);
    const heroImgRef = useRef(null);
    const titleRef = useRef(null);

    useDebounce(() => setdebouncedSearchTerm(searchTerm), 500, [searchTerm]);

    const fetchMovies = async (query = '') => {
        setIsLoading(true);
        setErrorMessage('');
        try {
            const endpoint = query
                ?  `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
                : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;
            const response = await fetch(endpoint, API_OPTIONS)

            if (!response.ok) {
                throw new Error("Failed to fetch movies");
            }

            const data = await response.json();
            if (data.Response === 'False') {
                setErrorMessage(data.Error || 'Failed to fetch movies');
                setMovieList([]);
                return
            }
            setMovieList(data.results || []);
            if(query && data.results.length > 0){
                await updateSearchCount(query, data.results[0]);
            }
        } catch (error){
            console.error(`Error while fetching movies: ${error}`);
            setErrorMessage(`Error fetching movies. Please try again later`);
        } finally {
            setIsLoading(false);
        }
    }

    const loadTrendingMovies = async () => {
        try {
            const movies = await getTrendingMovies();

            setTrendingMovies(movies);
        } catch (error){
            console.error(`Error while fetching trending movies: ${error}`);
        }
    }

    useEffect(() => {
        fetchMovies(debouncedSearchTerm);
        }, [debouncedSearchTerm]);

    useEffect(() => {
        loadTrendingMovies();
    }, []);

    //GSAP ANIMATION
    useEffect(() => {
        if (trendingMovies.length > 0 && trendingRef.current) {
            const items = trendingRef.current.querySelectorAll("li");
            let mm = gsap.matchMedia();

            mm.add({
                isDesktop: "(min-width: 1025px)",
                isMobile: "(max-width: 1024px)"
            }, (context) => {
                let { isDesktop } = context.conditions;

                gsap.fromTo(
                    items,
                    {
                        opacity: 0,
                        x: isDesktop ? 140 : 150,
                        y: 40,
                        scale: 0.8,
                    },
                    {
                        opacity: 1,
                        x: 0,
                        y: 0,
                        scale: 1,
                        stagger: 0.1,
                        ease: isDesktop ? "none" : "power1.out",
                        scrollTrigger: {
                            trigger: trendingRef.current,
                            start: isDesktop ? "top 80%" : "top 60%",
                            end: isDesktop ? "top 30%" : "top 20%",
                            scrub: isDesktop ? 1 : false,
                            toggleActions: isDesktop ? "none" : "play none reverse reverse",
                        },
                    }
                );
            });

            return () => mm.revert();
        }
    }, [trendingMovies]);
    useEffect(() => {
        if (!isLoading && movieList.length > 0 && allMoviesRef.current) {
            const cards = allMoviesRef.current.querySelectorAll(".movie-card");
            let mm = gsap.matchMedia();

            mm.add({

                isDesktop: "(min-width: 1025px)",
                isMobile: "(max-width: 1024px)"
            }, (context) => {
                let { isDesktop } = context.conditions;

                if (isDesktop) {

                    gsap.fromTo(cards,
                        { opacity: 0, y: 100 },
                        {
                            opacity: 1,
                            y: 0,
                            stagger: 0.1,
                            scrollTrigger: {
                                trigger: allMoviesRef.current,
                                start: "top 90%",
                                end: "bottom 80%",
                                scrub: 1,
                            }
                        }
                    );
                } else {
                    cards.forEach((card) => {
                        gsap.fromTo(card,
                            {
                                opacity: 0,
                                y: 80,
                                scale: 0.8
                            },
                            {
                                opacity: 1,
                                y: 0,
                                scale: 1,
                                duration: 0.7,
                                ease: "power1.inOut",
                                scrollTrigger: {
                                    trigger: card,
                                    start: "top 50%",
                                    toggleActions: "play none none none"
                                }
                            }
                        );
                    });
                }
            });

            return () => mm.revert(); // Очищення всіх медіа-запитів
        }
    }, [movieList, isLoading]);
    useEffect(() => {
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

        tl.fromTo(heroImgRef.current,
            {
                scale: 0.8,
                opacity: 0,
                y: 40
            },
            {
                scale: 1,
                opacity: 1,
                y: 0,
                duration: 1.2
            }
        )
            .fromTo(titleRef.current,
                {
                    y: 30,
                    opacity: 0
                },
                {
                    y: 0,
                    opacity: 1,
                    duration: 0.8
                },
                "-=0.6"
            );
    }, []);



    return (
        <main>
            <div className="pattern"/>

            <div className="wrapper">
                <header>
                    <img ref={heroImgRef} src={'./hero.png'} alt="hero banner" fetchPriority={"high"} loading={"eager"}/>
                    <h1 ref={titleRef}>Find <span className="text-gradient">Movies</span> You'll enjoy without the Hassle</h1>


                    <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
                </header>
                {trendingMovies.length > 0 && (
                    <section className="trending" ref={trendingRef}>
                        <h2>Trending movies</h2>
                        <ul>
                            {trendingMovies.map((movie, index) => (
                                <li key={movie.$id}>
                                    <p>{index + 1}</p>
                                    <img src={movie.poster_url} alt={movie.title}/>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
                <section className={"all-movies"} ref={allMoviesRef}>
                    <h2>All movies</h2>
                    {isLoading ? (
                        <Spinner />
                    ) : errorMessage ? (
                        <p className={"text-red-500"}>{errorMessage}</p>
                    ) : (
                        <ul>
                            {movieList.map((movie) => (
                                <MovieCard key={movie.id} movie={movie}/>
                            ))}
                        </ul>
                    )}
                </section>
            </div>


        </main>
    );

};

export default App;
